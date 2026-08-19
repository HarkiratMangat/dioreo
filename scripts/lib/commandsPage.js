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
const { assertProseCoverage, assertAskCoverage, assertSearchCoverage, searchHaystack, ASKS, COMMANDS } = require('./commandProse');

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
const DERIVED_NEUTRAL = '#8A8494';

/** Nudges a hex darker by `amount` of lightness, keeping the hue. Used for the two "meta" scopes, which are the sharp end of a mode rather than a colour of their own. */
function darken(hex, amount) {
    const [h, s, l] = rgb2hsl(hex2rgb(hex));
    return rgb2hex(hsl2rgb([h, s, Math.max(0, l - amount)]));
}

/**
 * The seven weapon-category accents, read out of utils/loadoutRender.js's MP_CATEGORY_ACCENT.
 *
 * These are the colours the bot actually answers in — it looks a weapon's own category up in this exact map at render time. Keyed by the uppercase category string, which is verbatim what /gunsmiths list offers as its `scope` choices.
 */
function loadCategoryAccents() {
    const src = fs.readFileSync(path.join(REPO, 'utils', 'loadoutRender.js'), 'utf8');
    const block = src.match(/const MP_CATEGORY_ACCENT\s*=\s*\{([\s\S]*?)\}/);
    if (!block) throw new Error('commandsPage.js: utils/loadoutRender.js no longer declares MP_CATEGORY_ACCENT. ' +
        'The page reads it so a scope can show the colour the bot will genuinely reply in. Point this at its ' +
        'new home — do not paste the hexes in here.');
    const out = {};
    for (const m of block[1].matchAll(/(\w+)\s*:\s*(\d+)/g)) out[m[1].toUpperCase()] = intToHex(m[2]);
    if (Object.keys(out).length < 5) throw new Error('commandsPage.js: parsed only ' + Object.keys(out).length +
        ' weapon-category accents. That map is the whole basis of the scope re-tint, so a near-empty parse is ' +
        'a silent downgrade.');
    return out;
}

/**
 * Every `scope` choice /gunsmiths list offers, mapped to the colour its answer comes back in.
 *
 * ⚠️ FOUR OF THE ELEVEN ARE NOT CATEGORIES, and leaving them out was a real defect: `retint()` fell through to removeProperty, so picking "All MP builds" made the whole card lose its colour — "where tf did the card go???". MP and DMZ have identity colours the bot already uses (commands/manage.js's per-page accents, sampled from the real emoji assets); the two meta scopes are the sharp end of those modes rather than a colour of their own, so they are the same hue held darker.
 */
function loadScopeAccents(cats) {
    const src = fs.readFileSync(path.join(REPO, 'commands', 'manage.js'), 'utf8');
    const grab = key => {
        const m = src.match(new RegExp(key + '\\s*:\\s*(\\d+)'));
        if (!m) throw new Error('commandsPage.js: commands/manage.js no longer declares ' + key +
            '. The page reads the bot\'s own MP and DMZ identity colours so the non-category scopes are not grey.');
        return intToHex(m[1]);
    };
    const mp = grab('loadouts_mp'), dmz = grab('loadouts_dmz');
    return {
        ...cats,
        'ALL MP BUILDS': mp,
        'META — MP': darken(mp, 0.12),
        'DMZ': dmz,
        'META — DMZ': darken(dmz, 0.1),
    };
}

/**
 * The weapon names the bot answers to, generated by scripts/exportWeaponIndex.mjs.
 *
 * ⚠️ THE SITE BUILDS WITH NO DATABASE, so without this file the page can only offer a bare text box while the bot offers real search — which is exactly what Harkirat pulled it up on: "why doesn't this support the actual autocomplete weapon search same as the bot?? We literally have the data available!". The artifact is the cost of that: re-run the exporter after a bulk loadout import. It is small enough (a few KB) to inline rather than fetch, which keeps the page a single self-contained file.
 */
function loadWeaponIndex() {
    const file = path.join(REPO, 'scripts', 'data', 'weapon-index.json');
    if (!fs.existsSync(file)) {
        throw new Error('commandsPage.js: scripts/data/weapon-index.json is missing. Generate it with\n' +
            '  node --env-file=.env scripts/exportWeaponIndex.mjs\n' +
            'Without it the weapon options fall back to a plain text box and the page silently offers less ' +
            'than the bot does.');
    }
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!data.MP || data.MP.length < 20) {
        throw new Error('commandsPage.js: weapon-index.json holds only ' + ((data.MP || []).length) +
            ' MP weapons, which means it was generated from a broken query rather than from a small collection.');
    }
    return data;
}

const RECEIVER_CSS = `
/* Page-scoped. Every selector is prefixed rx- so nothing can collide with the shared chrome,
   which this page draws from the same builders as every other page. */

/* ── THE HEAD ──────────────────────────────────────────────────────────────────
   No kicker. It read "DIOREO · 14 COMMANDS" above a page titled Commands, on a site
   called Dioreo — three facts the reader already had. The lede's measure is set in
   rem rather than ch so it stops wrapping "is." onto its own line in a 1100px column. */
.rx-top{padding-top:1.5rem}
.rx-h1{margin:0;font-family:var(--display);font-size:clamp(2rem,5vw,2.8rem);
  font-weight:800;letter-spacing:-.03em;line-height:1}
.rx-sub{margin:.55rem 0 0;font-family:var(--serif);font-size:1.06rem;color:var(--ink2);max-width:62rem}
.rx-sub em{font-style:italic;color:var(--ink)}

/* ── THE RAIL ────────────────────────────────────────────────────────────────── */
.rx-rail{position:sticky;top:54px;z-index:30;margin:1.25rem 0 0;padding:.7rem 0 .6rem;
  background:color-mix(in srgb,var(--desk) 92%,transparent);backdrop-filter:blur(10px)}
.rx-scroll{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center}
/* The group labels were pure --ink3 and read as abandoned beside the coloured chips. They
   now carry a tint of the PAGE accent, which is what they belong to — they label the index,
   not any one command. */
.rx-gl{flex:none;font-family:var(--mono);font-size:.63rem;letter-spacing:.15em;
  text-transform:uppercase;color:color-mix(in srgb,var(--accent-t) 74%,var(--ink3));
  padding:0 .5rem 0 .7rem;white-space:nowrap;line-height:1.9;
  border-left:1px solid color-mix(in srgb,var(--accent) 22%,transparent);margin-left:.25rem}
.rx-scroll > .rx-gl:first-of-type{border-left:0}
.rx-chip{display:inline-flex;align-items:center;gap:.45rem;flex:none;
  padding:.42rem .72rem;border-radius:999px;border:1px solid ${LINE};background:${BED};
  font-family:var(--mono);font-size:.8rem;color:var(--ink2);text-decoration:none;
  white-space:nowrap;transition:background .18s ease,border-color .18s ease,color .18s ease}
.rx-chip:hover{color:var(--ink);border-color:color-mix(in srgb,var(--cc) 60%,transparent);
  background:color-mix(in srgb,var(--cc) 10%,transparent)}
.rx-chip.on{background:var(--cc);border-color:var(--cc);color:var(--con);font-weight:600}
.rx-chip.on .rx-dot{display:none}
.rx-chip:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.rx-dot{width:8px;height:8px;border-radius:50%;background:var(--cc);flex:none}
/* The home chip belongs to the PAGE, so it wears the page accent rather than white. */
.rx-home-chip{font-weight:600;color:var(--accent-t);
  border-color:color-mix(in srgb,var(--accent) 45%,transparent)}
.rx-home-chip .rx-dot{background:var(--accent)}
.rx-home-chip.on{background:var(--accent);border-color:var(--accent);color:var(--accent-on)}

/* ── THE STAGE ─────────────────────────────────────────────────────────────── */
.rx-stage{margin:1.1rem 0 0}
.rx-p{display:none}
.rx-p:target{display:block}
.rx-home{display:block}
.rx-p:target ~ .rx-home{display:none}
.rx-p:focus{outline:none}
/* 🔴 SCROLL-MARGIN, AND IT MUST NOT GO MISSING AGAIN. A fragment jump parks the target at
   viewport top, which on this page is underneath a 54px fixed bar AND a sticky rail — so
   nearly every command opened with its own heading cut off. The rewrite dropped this
   declaration entirely and the defect fired on all fourteen. */
.rx-p,.rx-home{scroll-margin-top:9.5rem}

.rx-card{position:relative;overflow:hidden;border-radius:16px;
  background:linear-gradient(163deg,color-mix(in srgb,var(--cc) 26%,var(--raised)) 0%,
    color-mix(in srgb,var(--cc) 7%,var(--raised)) 38%,var(--raised) 74%);
  border:1px solid color-mix(in srgb,var(--cc) 30%,transparent);
  padding:1.5rem 1.7rem 1.7rem 1.9rem;transition:background .45s ease,border-color .45s ease}
.rx-card::before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:var(--cc);
  transition:background .45s ease}
.rx-card::after{content:"";position:absolute;right:-110px;top:-120px;width:340px;height:340px;
  border-radius:50%;background:var(--cc);opacity:.26;filter:blur(80px);pointer-events:none;
  transition:background .45s ease}

.rx-eyebrow{margin:0;font-family:var(--mono);font-size:.7rem;letter-spacing:.16em;
  text-transform:uppercase;color:var(--ink3)}
.rx-name{display:inline-flex;align-items:center;margin:.5rem 0 0;padding:.3rem .62rem;
  border-radius:8px;background:var(--cc);color:var(--con);
  font-family:var(--mono);font-size:1.22rem;font-weight:600;letter-spacing:-.01em;
  transition:background .45s ease,color .45s ease}
/* THE SLASH. One shared motion across all fourteen — it is the mark every one of these
   things has in common, so it is the right thing to animate once rather than fourteen times. */
.rx-sl{display:inline-block}
.rx-why{margin:.8rem 0 0;font-family:var(--serif);font-size:1.1rem;line-height:1.45;
  color:var(--ink);max-width:56rem}

/* ── WHAT YOU COULD NOT GUESS ──────────────────────────────────────────────────
   The old "IN DISCORD <description>" line restated the sentence above it — "no shit
   sherlock". These are behaviours instead: what the search does, what a blank option
   falls back to, what the reply looks like. */
.rx-facts{margin:1rem 0 0;padding:0;list-style:none;display:grid;gap:.42rem;max-width:64rem}
.rx-facts li{position:relative;padding-left:1.15rem;font-family:var(--serif);font-size:.98rem;
  line-height:1.45;color:var(--ink2)}
.rx-facts li::before{content:"";position:absolute;left:.1rem;top:.62em;width:5px;height:5px;
  border-radius:50%;background:var(--cc)}
.rx-facts code{font-family:var(--mono);font-size:.86em;padding:.05rem .3rem;border-radius:4px;
  background:color-mix(in srgb,var(--ink) 11%,transparent);color:var(--ink)}

/* ── THE LINE ────────────────────────────────────────────────────────────────── */
.rx-bar{position:sticky;top:calc(54px + 3.4rem);z-index:20;margin:1.3rem 0 0;
  display:flex;align-items:center;gap:.6rem;padding:.62rem .68rem;border-radius:12px;
  background:color-mix(in srgb,var(--desk) 62%,transparent);backdrop-filter:blur(12px) saturate(1.4);
  border:1px solid color-mix(in srgb,var(--ink) 16%,transparent);
  box-shadow:0 2px 14px color-mix(in srgb,#000 22%,transparent)}
.rx-line{flex:1;min-width:0;overflow-x:auto;display:flex;align-items:center;gap:.34rem;
  font-family:var(--mono);font-size:.86rem;scrollbar-width:none;padding:.1rem 0}
.rx-line::-webkit-scrollbar{display:none}
.rx-cmd{flex:none;padding:.2rem .44rem;border-radius:5px;background:var(--cc);color:var(--con);
  font-weight:600;transition:background .45s ease,color .45s ease}
/* Every token in the line is a BUTTON that opens its own option, the way clicking an option
   pill in Discord opens its picker. It used to be inert text beside controls you had to go
   and find. */
.rx-tok{flex:none;display:inline-flex;align-items:center;gap:.12rem;padding:.22rem .5rem;
  border-radius:6px;border:1px solid transparent;cursor:pointer;font:inherit;
  background:color-mix(in srgb,var(--ink) 10%,transparent);
  transition:opacity .18s ease,border-color .18s ease}
.rx-tok:hover{border-color:color-mix(in srgb,var(--cc) 70%,transparent)}
.rx-tok:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.rx-tok .rx-o{color:var(--ink3)}
.rx-tok .rx-o::after{content:":";color:var(--ink3);margin:0 .1rem 0 0}
.rx-tok .rx-v{color:var(--ink);font-weight:600}
.rx-tok[data-state=filled]{background:color-mix(in srgb,var(--cc) 30%,transparent)}
.rx-tok[data-state=empty]{opacity:.5;background:none;border:1px dashed ${LINE}}
.rx-tok[data-state=empty] .rx-o::after{content:""}
.rx-tok[data-state=need]{background:none;
  border:1px dashed color-mix(in srgb,var(--cc) 75%,transparent)}
.rx-tok[data-state=need] .rx-o{color:var(--ink2)}
.rx-tok[data-state=need] .rx-o::after{content:""}

/* Every button on this page is one object: a pill with a coloured outline, the idiom the
   shared GitHub button already uses in the bar. ⚠️ It carries the command's HUE — an
   earlier pass made these neutral and they read as dead. The accent-is-a-fill rule bans
   the hue on TEXT, not on a border or a wash. */
.rx-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;
  font-family:var(--mono);font-size:.7rem;letter-spacing:.13em;text-transform:uppercase;
  font-weight:600;padding:.52rem .95rem;border-radius:999px;cursor:pointer;
  background:color-mix(in srgb,var(--cc) 10%,transparent);color:var(--ci);
  border:1px solid color-mix(in srgb,var(--cc) 55%,transparent);
  transition:color .2s ease,border-color .2s ease,background .2s ease}
.rx-btn:hover{background:var(--cc);border-color:var(--cc);color:var(--con)}
.rx-btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.rx-btn[hidden]{display:none}
.rx-copy[data-done]{background:var(--cc);border-color:var(--cc);color:var(--con)}
/* ⚠️ COPY IS NEVER DISABLED. It used to refuse while a required option was empty, which
   removed a legitimate action: copying the bare command is exactly what you do when you
   want to type the rest in Discord yourself. */
.rx-clear{opacity:1}

/* ── THE SLOTS ─────────────────────────────────────────────────────────────────
   Two columns, and an OPEN slot spans both. That is what stops a fifteen-item timezone
   list running down one narrow column while the other half of the row sits empty, and it
   is the same rule that stops an open slot leaving a dead half-column beside a closed one. */
.rx-slots{margin:1.4rem 0 0;display:grid;grid-template-columns:1fr 1fr;gap:.6rem;align-items:start}
.rx-slot{border-radius:11px;border:1px solid ${LINE};background:${BED};min-width:0}
.rx-slot[open]{grid-column:1/-1;border-color:color-mix(in srgb,var(--cc) 40%,transparent);
  background:color-mix(in srgb,var(--cc) 6%,transparent)}
.rx-sum{display:block;padding:.68rem .85rem .72rem;cursor:pointer;list-style:none}
.rx-sum::-webkit-details-marker{display:none}
.rx-sum:focus-visible{outline:2px solid var(--accent);outline-offset:-2px;border-radius:11px}
.rx-sumhead{display:flex;align-items:center;gap:.5rem;min-height:26px}
.rx-caret{width:8px;height:8px;flex:none;border-right:1.5px solid var(--ink3);
  border-bottom:1.5px solid var(--ink3);transform:rotate(-45deg);margin-left:.2rem;
  transition:transform .2s ease}
.rx-slot[open] .rx-caret{transform:rotate(45deg)}
.rx-lab{font-family:var(--mono);font-size:.8rem;letter-spacing:.02em;color:var(--ink);
  flex:none;font-weight:600}
.rx-cur{font-family:var(--mono);font-size:.78rem;color:var(--ink3);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;margin-left:auto}
.rx-cur[data-set]{color:var(--ci)}
.rx-meta{display:flex;flex-wrap:wrap;gap:.3rem}
.rx-badge{font-family:var(--mono);font-size:.58rem;letter-spacing:.11em;text-transform:uppercase;
  padding:.16rem .4rem;border-radius:4px;white-space:nowrap;
  background:color-mix(in srgb,var(--ink) 11%,transparent);color:var(--ink2)}
.rx-badge.rx-b-req{background:var(--cc);color:var(--con);font-weight:700}
/* ONE description, and it is DISCORD'S OWN. The page used to print this sentence, then a
   hand-written near-duplicate, then the same near-duplicate again in the free-text branch. */
.rx-desc{margin:.4rem 0 0;font-family:var(--serif);font-size:.94rem;line-height:1.45;color:var(--ink2)}
.rx-body{padding:0 .85rem .9rem}

.rx-req{grid-column:1/-1;border:1px solid color-mix(in srgb,var(--cc) 55%,transparent);
  background:color-mix(in srgb,var(--cc) 11%,transparent);box-shadow:inset 3px 0 0 var(--cc)}
.rx-head{display:flex;align-items:center;gap:.5rem;padding:.75rem .85rem .1rem}
.rx-req .rx-desc{padding:0 .85rem}
.rx-in{display:block;width:100%;box-sizing:border-box;margin:.55rem 0 0;padding:.64rem .72rem;
  min-height:44px;border-radius:9px;border:1px solid color-mix(in srgb,var(--cc) 45%,transparent);
  background:var(--desk);color:var(--ink);font-family:var(--mono);font-size:.95rem}
.rx-in:focus{outline:none;border-color:var(--cc);
  box-shadow:0 0 0 3px color-mix(in srgb,var(--cc) 22%,transparent)}
.rx-in::placeholder{color:var(--ink3)}
.rx-egs{display:flex;flex-wrap:wrap;gap:.32rem;margin:.55rem 0 0}
.rx-eg{text-transform:none;letter-spacing:0;font-weight:400;font-size:.76rem;
  padding:.34rem .6rem;color:var(--ink2)}

/* The weapon picker. It matches partial words and updates live, the same two things the
   bot's own autocomplete does, because it reads the same weapon list. */
.rx-ac{margin:.5rem 0 0;display:flex;flex-wrap:wrap;gap:.3rem;align-items:center}
.rx-ac-hit{display:inline-flex;align-items:center;gap:.4rem;font-family:var(--mono);font-size:.76rem;
  padding:.32rem .6rem;min-height:34px;border-radius:7px;cursor:pointer;color:var(--ink2);
  background:${BED};border:1px solid ${LINE}}
.rx-ac-hit:hover{color:var(--ink);border-color:color-mix(in srgb,var(--cc) 55%,transparent)}
.rx-ac-hit i{width:7px;height:7px;border-radius:50%;flex:none}
.rx-ac-hit b{font-weight:400;color:var(--ink3);font-size:.68rem}
.rx-ac-none{font-family:var(--mono);font-size:.74rem;color:var(--ink3)}
.rx-ac-hit:focus-visible{outline:2px solid var(--accent);outline-offset:2px}

.rx-vals{display:flex;flex-wrap:wrap;gap:.34rem}
.rx-pill{font-family:var(--mono);font-size:.78rem;text-align:left;padding:.42rem .62rem;
  min-height:36px;border-radius:7px;cursor:pointer;color:var(--ink2);background:${BED};
  border:1px solid ${LINE};transition:background .16s ease,border-color .16s ease,color .16s ease}
.rx-pill:hover{color:var(--ink);border-color:color-mix(in srgb,var(--cc) 55%,transparent)}
.rx-pill[aria-pressed=true]{background:var(--cc);border-color:var(--cc);color:var(--con);font-weight:600}
.rx-pill:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.rx-hint{display:block;font-size:.68rem;opacity:.72;margin-top:.12rem}
/* ⚠️ FOLDS ONLY WHEN THERE IS GENUINELY TOO MUCH. The threshold was 6, tuned for a narrow
   two-zone layout that no longer exists, so an eleven-item scope list hid five of itself on
   a page with room for all of them. */
.rx-more{text-transform:none;letter-spacing:.04em;font-size:.74rem;padding:.42rem .7rem}
.rx-bare{margin:0;font-family:var(--serif);font-size:.96rem;color:var(--ink2)}

.rx-live{margin:1rem 0 0;font-family:var(--serif);font-size:.98rem;color:var(--ink2);
  display:flex;flex-wrap:wrap;align-items:center;gap:.5rem}
.rx-live b{font-family:var(--mono);font-size:.85rem;font-weight:500;color:var(--ink);
  padding:.12rem .36rem;border-radius:4px;background:color-mix(in srgb,var(--cc) 22%,transparent)}

/* /colors is the one command whose SUBJECT is colour, and it had none. Six swatches that
   walk the profile sources the command actually reads, cycling through the palette the bot
   would extract. The rest of the page shares one motion language; this earns its own. */
.rx-swatch{display:flex;gap:.4rem;margin:1rem 0 0;flex-wrap:wrap}
.rx-swatch i{width:2.6rem;height:2.6rem;border-radius:9px;display:block;
  border:1px solid color-mix(in srgb,var(--ink) 14%,transparent)}
.rx-swatch span{font-family:var(--mono);font-size:.6rem;letter-spacing:.1em;text-transform:uppercase;
  color:var(--ink3);align-self:center}

/* ── THE HOME STATE ────────────────────────────────────────────────────────────
   It leads with the COMMANDS now. The page is called Commands and the commands were its
   smallest element, while fourteen plain-language scenarios filled the card — so a reader
   could not tell the scenarios each pointed at one command. Cards first, scenarios as the
   companion for anyone who does not know the name. */
/* The landing card wears the PAGE accent, which is a loud green, and it is the only card
   holding fourteen other colours at once — so its wash is held well below a command panel's.
   The point of the tint here is to say "this is the index, not a command", not to compete. */
.rx-home .rx-card{background:linear-gradient(163deg,color-mix(in srgb,var(--cc) 13%,var(--raised)) 0%,
  color-mix(in srgb,var(--cc) 4%,var(--raised)) 34%,var(--raised) 68%)}
.rx-home .rx-card::after{opacity:.12}
.rx-home h2{margin:0;font-family:var(--display);font-size:1.35rem;font-weight:700;letter-spacing:-.02em}
.rx-lead{margin:.4rem 0 1.2rem;font-family:var(--serif);font-size:1.02rem;color:var(--ink2);max-width:58rem}
.rx-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(21rem,1fr));gap:.55rem}
.rx-cd{display:block;text-decoration:none;border-radius:12px;padding:.85rem 1rem .95rem;
  border:1px solid ${LINE};background:${BED};
  transition:border-color .18s ease,background .18s ease,transform .18s ease}
.rx-cd:hover{border-color:color-mix(in srgb,var(--cc) 60%,transparent);
  background:color-mix(in srgb,var(--cc) 9%,transparent);transform:translateY(-1px)}
.rx-cd:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.rx-cd-n{display:flex;align-items:center;gap:.45rem;font-family:var(--mono);font-size:.92rem;
  font-weight:600;color:var(--ci)}
.rx-cd-n i{width:8px;height:8px;border-radius:50%;background:var(--cc);flex:none}
.rx-cd-w{margin:.35rem 0 0;font-family:var(--serif);font-size:.94rem;line-height:1.4;color:var(--ink2)}
.rx-cd-o{margin:.45rem 0 0;display:flex;flex-wrap:wrap;gap:.25rem}
.rx-cd-o span{font-family:var(--mono);font-size:.64rem;padding:.13rem .38rem;border-radius:4px;
  background:color-mix(in srgb,var(--ink) 10%,transparent);color:var(--ink3)}
.rx-cd-o span.req{background:color-mix(in srgb,var(--cc) 26%,transparent);color:var(--ink)}

.rx-asks-h{margin:1.7rem 0 .2rem;font-family:var(--mono);font-size:.68rem;letter-spacing:.15em;
  text-transform:uppercase;color:color-mix(in srgb,var(--accent-t) 74%,var(--ink3))}
.rx-asks-s{margin:0 0 .7rem;font-family:var(--serif);font-size:.96rem;color:var(--ink2)}
.rx-asks{display:grid;grid-template-columns:repeat(auto-fill,minmax(19rem,1fr));gap:.1rem 2rem}
.rx-ask{display:flex;align-items:center;gap:.6rem;padding:.6rem .4rem .6rem .1rem;
  min-height:44px;text-decoration:none;border-bottom:1px solid ${LINE};
  transition:padding-left .16s ease}
.rx-ask:hover{padding-left:.45rem}
.rx-ask span{flex:1;font-family:var(--serif);font-size:.96rem;color:var(--ink)}
.rx-ask em{font-family:var(--mono);font-style:normal;font-size:.72rem;color:var(--ink3);flex:none}
.rx-ask i{width:6px;height:6px;border-radius:50%;background:var(--cc);flex:none}
.rx-ask:hover em{color:var(--ci)}
.rx-ask:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:5px}

/* The install explainer lives inside /invite now, where a reader who wants it already is.
   It used to sit on the landing card, which is a page about commands. */
.rx-inst{margin:1.2rem 0 0;display:grid;grid-template-columns:1fr 1fr;gap:.6rem}
.rx-inst div{border-radius:12px;border:1px solid ${LINE};background:${BED};padding:.9rem 1rem 1rem}
.rx-inst b{display:block;font-family:var(--mono);font-size:.78rem;font-weight:600;color:var(--ci)}
.rx-inst p{margin:.4rem 0 0;font-family:var(--serif);font-size:.95rem;line-height:1.45;color:var(--ink2)}

.rx-none{margin:.7rem 0 0;font-family:var(--mono);font-size:.76rem;color:var(--ink3)}
.rx-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* ── MOTION ────────────────────────────────────────────────────────────────────
   🔴 .rx-card ANIMATES OPACITY ONLY — NEVER A TRANSFORM. It contains .rx-bar, which is
   position:fixed on a phone, and a transform of ANY value (including the identity matrix a
   final "transform: none" keyframe computes to) makes its element a containing block for
   every fixed descendant. With translateY on the card the pinned line was measured at
   top:1268px in an 812px window. */
@media (prefers-reduced-motion:no-preference){
  .rx-p:target .rx-card{animation:rx-fade .26s ease backwards}
  .rx-p:target .rx-card::before{animation:rx-wipe .42s cubic-bezier(.2,.7,.3,1) backwards}
  .rx-p:target .rx-eyebrow,.rx-p:target .rx-name,.rx-p:target .rx-why{
    animation:rx-in .34s cubic-bezier(.2,.7,.3,1) backwards}
  .rx-p:target .rx-name{animation-delay:.04s}
  .rx-p:target .rx-why{animation-delay:.08s}
  .rx-sl{animation:rx-slash 4.5s ease-in-out infinite}
  .rx-tok.rx-land{animation:rx-land .22s cubic-bezier(.2,.8,.3,1)}
  .rx-slot[open] .rx-body{animation:rx-open .22s ease backwards}
  .rx-swatch i{animation:rx-hue 9s linear infinite}
  .rx-swatch i:nth-child(2){animation-delay:-1.5s}
  .rx-swatch i:nth-child(3){animation-delay:-3s}
  .rx-swatch i:nth-child(4){animation-delay:-4.5s}
  .rx-swatch i:nth-child(5){animation-delay:-6s}
}
@keyframes rx-fade{from{opacity:0}to{opacity:1}}
@keyframes rx-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes rx-wipe{from{transform:scaleY(0);transform-origin:top}to{transform:scaleY(1)}}
@keyframes rx-land{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
@keyframes rx-open{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@keyframes rx-slash{0%,72%,100%{transform:none}78%{transform:translateY(-2px) rotate(-9deg)}86%{transform:translateY(1px) rotate(3deg)}}
@keyframes rx-hue{0%{filter:hue-rotate(0)}100%{filter:hue-rotate(360deg)}}

/* ── NARROW ──────────────────────────────────────────────────────────────────── */
@media (max-width:900px){
  .rx-top{padding-top:1rem}
  .rx-sub{font-size:.98rem}
  .rx-rail{margin-top:1rem;padding:.55rem 0;top:calc(54px + env(safe-area-inset-top,0px))}
  .rx-scroll{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;
    scroll-snap-type:x proximity;padding-bottom:.15rem}
  .rx-scroll::-webkit-scrollbar{display:none}
  .rx-chip{scroll-snap-align:start;min-height:44px}
  .rx-gl{font-size:.58rem;padding:0 .4rem 0 .55rem}
  .rx-card{padding:1.2rem 1.1rem 1.3rem 1.4rem;border-radius:14px}
  .rx-why{font-size:1rem}
  .rx-slots,.rx-inst{grid-template-columns:minmax(0,1fr)}
  .rx-asks{grid-template-columns:minmax(0,1fr);gap:0}
  /* 🔴 THE COMMAND CARDS COLLAPSE TO NAMES ON A PHONE, AND THAT IS DELIBERATE. The full
     card — name, purpose, option chips — is 115px, and fourteen of them made the landing
     state 3292px, 4.1 screenfuls, on the device most of these readers are using. Harkirat,
     2026-08-19: "a strong majority of users will view the website on mobile since codm is
     literally a mobile game and discord is primarily used on mobile." Two per row, names
     only, so all fourteen are visible at once — which the horizontally-scrolling rail above
     cannot do, so this is a different job rather than a duplicate of it. The purpose and the
     options are one tap away in the panel itself. */
  .rx-cards{grid-template-columns:1fr 1fr;gap:.4rem}
  .rx-cd{padding:.6rem .7rem;min-height:44px;display:flex;align-items:center}
  .rx-cd-w,.rx-cd-o{display:none}
  .rx-cd-n{font-size:.82rem}
  .rx-lead{margin-bottom:.8rem;font-size:.96rem}
  .rx-p,.rx-home{scroll-margin-top:7.5rem}
  .rx-bar{position:fixed;left:.6rem;right:.6rem;bottom:calc(.6rem + env(safe-area-inset-bottom,0px));
    top:auto;margin:0;border-radius:13px;
    box-shadow:0 6px 26px color-mix(in srgb,#000 42%,transparent)}
  .rx-p:not(:target) .rx-bar{display:none}
  .rx-floor{padding-bottom:5.6rem}
}
@media (pointer:coarse){
  .rx-chip,.rx-pill,.rx-btn,.rx-ac-hit{min-height:44px}
  .rx-ask,.rx-sum{min-height:48px}
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
    '  var WEAPONS=window.__RX_WEAPONS||{};',
    '',
    '  function el(tag,cls,txt){ var n=document.createElement(tag); if(cls) n.className=cls;',
    '    if(txt!=null) n.textContent=txt; return n; }',
    '',
    '  function value(slot){',
    '    var input=slot.querySelector(".rx-in");',
    '    if(input) return input.value.trim();',
    '    var on=slot.querySelector(".rx-pill[aria-pressed=true]");',
    '    return on?on.getAttribute("data-val"):"";',
    '  }',
    '',
    '  /* Every option keeps its seat in the line, and the loop walks the SLOTS rather than the',
    '     set of values the reader has picked. That is the fix for a shipped defect: a free-text',
    '     required option can never be in the picked set, so touching anything optional deleted',
    '     it and the page handed out a command Discord rejects. */',
    '  function paint(p,landed){',
    '    var line=p.querySelector(".rx-line"); if(!line) return;',
    '    var btn=p.querySelector(".rx-copy"), clear=p.querySelector(".rx-clear");',
    '    line.textContent="";',
    '    line.appendChild(el("span","rx-cmd",p.getAttribute("data-cmd")));',
    '    var plain=p.getAttribute("data-cmd"), set=0;',
    '    [].slice.call(p.querySelectorAll("[data-opt]")).forEach(function(o){',
    '      var name=o.getAttribute("data-opt"), val=value(o), req=o.getAttribute("data-req")==="1";',
    '      var tok=document.createElement("button");',
    '      tok.type="button";',
    '      tok.className="rx-tok"+(landed===name?" rx-land":"");',
    '      tok.setAttribute("data-state", val?"filled":(req?"need":"empty"));',
    '      tok.setAttribute("data-goto",name);',
    '      tok.setAttribute("aria-label",(val?("Change "+name):("Set "+name)));',
    '      tok.appendChild(el("span","rx-o",name));',
    '      if(val){ tok.appendChild(el("span","rx-v",val)); plain+=" "+name+":"+val; set++; }',
    '      line.appendChild(tok);',
    '    });',
    '    /* ⚠️ COPY NEVER REFUSES. It used to disable while a required option was empty, which',
    '       took away a real action — copying the bare command so you can type the rest in',
    '       Discord yourself is exactly what someone does. */',
    '    if(btn){ btn.removeAttribute("data-done"); btn.textContent="Copy";',
    '      btn.setAttribute("data-plain",plain);',
    '      btn.setAttribute("aria-label","Copy "+plain); }',
    '    if(clear) clear.hidden = set===0;',
    '    if(landed) line.scrollLeft=line.scrollWidth;',
    '  }',
    '',
    '  function summarise(slot){',
    '    var cur=slot.querySelector(".rx-cur"); if(!cur) return;',
    '    var v=value(slot);',
    '    cur.textContent=v||cur.getAttribute("data-empty");',
    '    if(v) cur.setAttribute("data-set","1"); else cur.removeAttribute("data-set");',
    '  }',
    '',
    '  /* The answer comes back in the colour of what you asked for, so the page shows that.',
    '     ⚠️ ALL ELEVEN scopes are in the table, not just the seven categories — four of them',
    '       used to fall through to removeProperty, which made the card lose its colour',
    '       entirely and read as though the panel had vanished. */',
    '  function tintFrom(p,hex){',
    '    var chip=document.querySelector(\'.rx-chip[data-for="\'+p.id+\'"]\');',
    '    if(hex){ p.style.setProperty("--cc",hex[0]); p.style.setProperty("--con",hex[1]);',
    '      p.style.setProperty("--ct",hex[2]); p.style.setProperty("--ctl",hex[3]);',
    '      /* the rail chip follows the live tint too; it used to stay grey while the card changed */',
    '      if(chip){ chip.style.setProperty("--cc",hex[0]); chip.style.setProperty("--con",hex[1]);',
    '        chip.style.setProperty("--ct",hex[2]); chip.style.setProperty("--ctl",hex[3]); } }',
    '    else { ["--cc","--con","--ct","--ctl"].forEach(function(k){ p.style.removeProperty(k);',
    '      if(chip) chip.style.removeProperty(k); }); }',
    '  }',
    '  function retintChoice(p,slot){',
    '    var map=p.getAttribute("data-tint"); if(!map) return;',
    '    var on=slot.querySelector(".rx-pill[aria-pressed=true]");',
    '    var table=JSON.parse(map);',
    '    tintFrom(p, on?table[on.getAttribute("data-val").toUpperCase()]:null);',
    '  }',
    '',
    '  /* The weapon field searches the same list the bot does — partial words match and the',
    '     results update on every keystroke, which are the two things the reader could not',
    '     have guessed and the two the old page never mentioned. */',
    '  function autocomplete(p,slot){',
    '    var mode=slot.getAttribute("data-weapons"); if(!mode) return;',
    '    var list=WEAPONS[mode]||[], input=slot.querySelector(".rx-in");',
    '    var box=slot.querySelector(".rx-ac"); if(!box) return;',
    '    var q=input.value.trim().toLowerCase();',
    '    box.textContent="";',
    '    var hits=list.filter(function(w){',
    '      return !q || w.name.toLowerCase().indexOf(q)>-1 || (w.key||"").indexOf(q.replace(/\\s+/g,""))>-1;',
    '    });',
    '    var exact=hits.length===1&&hits[0].name.toLowerCase()===q;',
    '    if(!q){ box.appendChild(el("span","rx-ac-none",list.length+" weapons — start typing")); return; }',
    '    if(!hits.length){ box.appendChild(el("span","rx-ac-none","No weapon matches \\u201C"+input.value.trim()+"\\u201D"));',
    '      tintFrom(p,null); return; }',
    '    if(exact){',
    '      var tints=JSON.parse(p.getAttribute("data-cats")||"{}");',
    '      tintFrom(p,tints[(hits[0].category||"").toUpperCase()]||null);',
    '    }',
    '    hits.slice(0,10).forEach(function(w){',
    '      var b=document.createElement("button"); b.type="button"; b.className="rx-ac-hit";',
    '      b.setAttribute("data-val",w.name);',
    '      var dot=el("i"); if(w.tint) dot.style.background=w.tint; b.appendChild(dot);',
    '      b.appendChild(document.createTextNode(w.name));',
    '      if(w.builds>1) b.appendChild(el("b",null,w.builds+" builds"));',
    '      b.addEventListener("click",function(){',
    '        input.value=w.name; input.focus();',
    '        autocomplete(p,slot); summarise(slot); paint(p,slot.getAttribute("data-opt"));',
    '      });',
    '      box.appendChild(b);',
    '    });',
    '    if(hits.length>10) box.appendChild(el("span","rx-ac-none","+"+(hits.length-10)+" more"));',
    '  }',
    '',
    '  panels.forEach(function(p){',
    '    var tintSlot=p.getAttribute("data-tint-opt");',
    '    [].slice.call(p.querySelectorAll(".rx-pill")).forEach(function(b){',
    '      b.addEventListener("click",function(){',
    '        var slot=b.closest("[data-opt]"), was=b.getAttribute("aria-pressed")==="true";',
    '        var req=slot.getAttribute("data-req")==="1";',
    '        [].slice.call(slot.querySelectorAll(".rx-pill")).forEach(function(x){ x.setAttribute("aria-pressed","false"); });',
    '        if(!was || req) b.setAttribute("aria-pressed","true");',
    '        summarise(slot);',
    '        if(tintSlot && slot.getAttribute("data-opt")===tintSlot) retintChoice(p,slot);',
    '        paint(p,slot.getAttribute("data-opt"));',
    '      });',
    '    });',
    '    [].slice.call(p.querySelectorAll(".rx-in")).forEach(function(i){',
    '      var slot=i.closest("[data-opt]");',
    '      i.addEventListener("input",function(){ autocomplete(p,slot); summarise(slot); paint(p,null); });',
    '      autocomplete(p,slot);',
    '    });',
    '    [].slice.call(p.querySelectorAll(".rx-eg")).forEach(function(e){',
    '      e.addEventListener("click",function(){',
    '        var slot=e.closest("[data-opt]"), input=slot.querySelector(".rx-in"); if(!input) return;',
    '        input.value=e.getAttribute("data-val"); input.focus();',
    '        autocomplete(p,slot); summarise(slot); paint(p,slot.getAttribute("data-opt"));',
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
    '    /* Clicking a token in the line opens that option, the way clicking an option pill in',
    '       Discord opens its picker. The tokens used to be inert text beside controls the',
    '       reader had to go and find for themselves. */',
    '    p.addEventListener("click",function(ev){',
    '      var tok=ev.target.closest(".rx-tok"); if(!tok||!p.contains(tok)) return;',
    '      var slot=p.querySelector(\'[data-opt="\'+tok.getAttribute("data-goto")+\'"]\');',
    '      if(!slot) return;',
    '      if(slot.tagName==="DETAILS") slot.open=true;',
    '      slot.scrollIntoView({block:"center",behavior:"smooth"});',
    '      var focusable=slot.querySelector(".rx-in,.rx-pill"); if(focusable) focusable.focus({preventScroll:true});',
    '    });',
    '    var copy=p.querySelector(".rx-copy");',
    '    if(copy) copy.addEventListener("click",function(){',
    '      var text=copy.getAttribute("data-plain")||"";',
    '      if(navigator.clipboard) navigator.clipboard.writeText(text)["catch"](function(){});',
    '      copy.textContent="Copied"; copy.setAttribute("data-done","1");',
    '    });',
    '    /* One control that empties everything. There was none, so undoing meant unclicking',
    '       each option one at a time. */',
    '    var clear=p.querySelector(".rx-clear");',
    '    if(clear) clear.addEventListener("click",function(){',
    '      [].slice.call(p.querySelectorAll("[data-opt]")).forEach(function(slot){',
    '        var req=slot.getAttribute("data-req")==="1";',
    '        var input=slot.querySelector(".rx-in");',
    '        if(input){ input.value=""; autocomplete(p,slot); }',
    '        var pills=[].slice.call(slot.querySelectorAll(".rx-pill"));',
    '        pills.forEach(function(x){ x.setAttribute("aria-pressed","false"); });',
    '        if(req && pills.length) pills[0].setAttribute("aria-pressed","true");',
    '        summarise(slot);',
    '      });',
    '      if(tintSlot) tintFrom(p,null);',
    '      paint(p,null);',
    '    });',
    '    [].slice.call(p.querySelectorAll("[data-opt]")).forEach(summarise);',
    '    paint(p,null);',
    '  });',
    '',
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
    '  /* 🔴 location.hash, NOT history.pushState. pushState changes the URL without performing a',
    '     navigation, so :target does NOT update and the panel stays open — the key appears to do',
    '     nothing. Setting the hash is a same-document navigation: it clears :target, fires',
    '     hashchange, and does not reload, so anything typed into the panel survives. */',
    '  addEventListener("keydown",function(e){',
    '    if(e.key!=="Escape") return;',
    '    if(!document.querySelector(".rx-p:target")) return;',
    '    if(document.activeElement && document.activeElement.tagName==="INPUT") return;',
    '    location.hash="";',
    '    mark();',
    '  });',
    '',
    '  var q=document.getElementById("rx-q"), count=document.getElementById("rx-count");',
    '  function filter(){',
    '    var v=q.value.trim().toLowerCase(), hits=0;',
    '    chips.forEach(function(c){',
    '      var on=!v||(c.getAttribute("data-find")||"").toLowerCase().indexOf(v)>-1;',
    '      c.hidden=!on; if(on) hits++;',
    '    });',
    '    [].slice.call(document.querySelectorAll(".rx-gl")).forEach(function(s){ s.hidden=!!v; });',
    '    count.textContent=!v?"":(hits?hits+" of "+chips.length+" match":"Nothing matches "+q.value.trim());',
    '  }',
    '  if(q){ q.addEventListener("input",filter); filter(); }',
    '',
    '  var live=document.getElementById("rx-live");',
    '  if(live && window.Intl){',
    '    try{',
    '      var zone=Intl.DateTimeFormat().resolvedOptions().timeZone;',
    '      var now=new Intl.DateTimeFormat([], {hour:"numeric",minute:"2-digit"}).format(new Date());',
    '      live.querySelector("b").textContent=now+" \\u00B7 "+zone;',
    '      live.hidden=false;',
    '      var use=live.querySelector(".rx-btn");',
    '      if(use){',
    '        var panel=live.closest(".rx-p");',
    '        var slot=panel.querySelector("[data-opt=timezone]");',
    '        var match=slot&&[].slice.call(slot.querySelectorAll(".rx-pill")).filter(function(b){',
    '          return b.getAttribute("data-val").indexOf(zone.split("/").pop())>-1;',
    '        })[0];',
    '        if(match){ use.hidden=false;',
    '          use.addEventListener("click",function(){ slot.open=true; match.hidden=false; match.click(); }); }',
    '      }',
    '    }catch(e){}',
    '  }',
    '})();',
].join('\n');

/** A few choices carry a HINT as well as a name, packed into one string because Discord has only one field for it. Only the name goes into the command line. */
const splitChoice = choice => {
    const i = choice.indexOf(' — ');
    return i === -1
        ? { label: choice, hint: '' }
        : { label: choice.slice(0, i).trim(), hint: choice.slice(i + 3).trim() };
};

/**
 * How many choices show before the rest fold away.
 *
 * ⚠️ TWELVE, NOT SIX. Six was tuned for the two-zone layout this page no longer has, and it survived the move to a full-width card — so an eleven-item scope list hid five of itself, and a "Show fewer" control appeared on a page with room for everything. Twelve means the only list that folds is the fifteen-item timezone one, which genuinely is long.
 */
const VISIBLE_CHOICES = 12;

/**
 * Required first — that order is information, not styling.
 *
 * ⚠️ `visibility` IS IN THIS LIST NOW. It used to be filtered out and described in a prose footnote instead, which was wrong twice over: it is a selectable option like any other, and the filter ran BEFORE the "no options" check, so `/invite` rendered "No options — just run it." while its one option sat in the footnote below. Harkirat: "blatant lie... visibility is literally an option."
 */
const ownOptions = command => command.options
    .slice().sort((a, b) => Number(b.required) - Number(a.required));

/** What an option IS, in three words or fewer: whether it must be filled, and what it takes. */
function badges(option, required) {
    const out = ['<span class="rx-badge' + (required ? ' rx-b-req' : '') + '">' +
        (required ? 'required' : 'optional') + '</span>'];
    if (option.choices.length) out.push('<span class="rx-badge">' + option.choices.length + ' choices</span>');
    else if (option.autocomplete) out.push('<span class="rx-badge">search</span>');
    else out.push('<span class="rx-badge">text</span>');
    return '<span class="rx-meta">' + out.join('') + '</span>';
}

/** Which weapon list an option searches, or '' when it is not a weapon option. */
const weaponMode = (command, option) =>
    option.name !== 'weapon' ? '' : (command.path === '/dmz' ? 'DMZ' : 'MP');

function choiceBlock(option, tints, chosen) {
    const pills = option.choices.map((choice, i) => {
        const { label, hint } = splitChoice(choice);
        const tint = tints && tints[label.toUpperCase()];
        const fold = i >= VISIBLE_CHOICES && label !== chosen;
        return '<button type="button" class="rx-pill" aria-pressed="' + (label === chosen ? 'true' : 'false') +
            '" data-val="' + label.replace(/"/g, '&quot;') + '"' +
            (tint ? ' style="--cc:' + tint[0] + ';--con:' + tint[1] + '"' : '') +
            (fold ? ' hidden' : '') + '>' + label +
            (hint ? '<span class="rx-hint">' + hint + '</span>' : '') + '</button>';
    }).join('');
    const label = '+' + (option.choices.length - VISIBLE_CHOICES) + ' more';
    const more = option.choices.length > VISIBLE_CHOICES
        ? '<button type="button" class="rx-btn rx-more" data-open="0" data-visible="' + VISIBLE_CHOICES +
          '" data-label="' + label + '">' + label + '</button>'
        : '';
    return '<div class="rx-vals">' + pills + more + '</div>';
}

/**
 * The required slot. Always open, never collapsed, never read-only.
 *
 * Free text gets a real input seeded with the sample; a fixed choice list gets pills with one already chosen, because a required option is never legitimately empty. A weapon option additionally gets the real search: the same list the bot autocompletes against, matching partial words and updating live.
 */
function renderRequired(option, command, C, tints, weapons) {
    const { esc } = C;
    const entry = COMMANDS[command.path] || {};
    const mode = weaponMode(command, option);
    const head = '<div class="rx-head"><span class="rx-lab">' + esc(option.name) + '</span>' +
        badges(option, true) + '</div>' +
        (option.description ? '<p class="rx-desc">' + esc(option.description) + '</p>' : '');

    if (option.choices.length) {
        const chosen = (entry.sample || {})[option.name] || splitChoice(option.choices[0]).label;
        return '<div class="rx-slot rx-req" data-opt="' + esc(option.name) + '" data-req="1">' + head +
            '<div class="rx-body">' + choiceBlock(option, tints, chosen) + '</div></div>';
    }

    const seed = (entry.sample || {})[option.name] || '';
    const egs = ((entry.examples || {})[option.name] || [])
        .map(e => '<button type="button" class="rx-btn rx-eg" data-val="' + esc(e) + '">' + esc(e) + '</button>').join('');
    const id = 'rx-' + esc(command.id) + '-' + esc(option.name);
    return '<div class="rx-slot rx-req" data-opt="' + esc(option.name) + '" data-req="1"' +
        (mode ? ' data-weapons="' + mode + '"' : '') + '>' + head +
        '<div class="rx-body">' +
        '<label class="rx-sr" for="' + id + '">' + esc(option.name) + '</label>' +
        '<input class="rx-in" id="' + id + '" type="text" value="' + esc(seed) + '" ' +
        'placeholder="' + esc(mode ? 'Type any part of a weapon name' : option.description || option.name) + '" ' +
        'autocomplete="off" spellcheck="false">' +
        (mode ? '<div class="rx-ac" role="status" aria-label="Matching weapons"></div>' : '') +
        (egs ? '<div class="rx-egs">' + egs + '</div>' : '') +
        '</div></div>';
}

/** An optional slot: a native <details>, so a long list costs one row until it is wanted. */
function renderOptional(option, command, C, tints) {
    const { esc } = C;
    const body = option.choices.length
        ? choiceBlock(option, tints, null)
        : '<p class="rx-bare">' + esc(option.description || '') + '</p>';
    return '<details class="rx-slot" data-opt="' + esc(option.name) + '" data-req="0">' +
        '<summary class="rx-sum">' +
        '<span class="rx-sumhead"><span class="rx-lab">' + esc(option.name) + '</span>' +
        badges(option, false) +
        '<span class="rx-cur" data-empty="Not set">Not set</span>' +
        '<i class="rx-caret" aria-hidden="true"></i></span>' +
        (option.description ? '<span class="rx-desc">' + esc(option.description) + '</span>' : '') +
        '</summary>' +
        '<div class="rx-body">' + body + '</div></details>';
}

/**
 * The line, rendered at BUILD time so it is right with no JS at all, walking EVERY option rather than the ones that happen to have a value.
 */
function runLine(command, C) {
    const { esc } = C;
    const sample = (COMMANDS[command.path] || {}).sample || {};
    const options = ownOptions(command);
    const parts = ['<span class="rx-cmd">' + slashName(command.path, C) + '</span>'];
    let plain = command.path, set = 0;
    for (const option of options) {
        const value = option.required
            ? (sample[option.name] || (option.choices.length ? splitChoice(option.choices[0]).label : ''))
            : '';
        const state = value ? 'filled' : (option.required ? 'need' : 'empty');
        parts.push('<button type="button" class="rx-tok" data-state="' + state + '" ' +
            'data-goto="' + esc(option.name) + '" aria-label="' + (value ? 'Change ' : 'Set ') + esc(option.name) + '">' +
            '<span class="rx-o">' + esc(option.name) + '</span>' +
            (value ? '<span class="rx-v">' + esc(value) + '</span>' : '') + '</button>');
        if (value) { plain += ' ' + option.name + ':' + value; set++; }
    }
    return '<div class="rx-bar">' +
        '<code class="rx-line">' + parts.join('') + '</code>' +
        '<button type="button" class="rx-btn rx-clear"' + (set ? '' : ' hidden') + '>Clear</button>' +
        '<button type="button" class="rx-btn rx-copy" data-plain="' + esc(plain) + '" ' +
        'aria-label="Copy ' + esc(plain) + '">Copy</button></div>';
}

/** The command name with its slash wrapped, so the one mark all fourteen share can carry the page's shared motion. */
function slashName(path, C) {
    return '<span class="rx-sl" aria-hidden="true">/</span>' + C.esc(path.slice(1));
}

/** The handful of things a reader could not have guessed. Backticked words render as code. */
function renderFacts(entry, C) {
    const { esc } = C;
    if (!(entry.facts || []).length) return '';
    const li = entry.facts.map(f =>
        '<li>' + esc(f).replace(/`([^`]+)`/g, '<code>$1</code>') + '</li>').join('');
    return '<ul class="rx-facts">' + li + '</ul>';
}

/** One command's panel. */
function renderPanel(command, group, C, accents, cats, scopes) {
    const { esc } = C;
    const entry = COMMANDS[command.path] || {};
    const options = ownOptions(command);
    const derived = DERIVED.has(command.path);

    const tintOpt = command.path === '/gunsmiths list' ? 'scope' : '';
    const tuple = hex => [hex, solveOn(hex), solveText(hex, GROUND_DARK), solveText(hex, GROUND_LIGHT)];
    const tintTable = tintOpt
        ? Object.fromEntries(Object.entries(scopes).map(([k, v]) => [k, tuple(v)]))
        : null;
    // A weapon option re-tints from the weapon's OWN category, which is what the bot does.
    const catTable = options.some(o => weaponMode(command, o))
        ? Object.fromEntries(Object.entries(cats).map(([k, v]) => [k, tuple(v)]))
        : null;

    const extras = [];
    if (command.path === '/timestamp') {
        extras.push('<p class="rx-live" id="rx-live" hidden>Your timezone looks like <b></b>' +
            '<button type="button" class="rx-btn" hidden>Use this timezone</button></p>');
    }
    if (command.path === '/colors') {
        // The one command whose subject IS colour, and it had none.
        const sources = ['Avatar', 'Banner', 'Name', 'Nameplate', 'Deco'];
        extras.push('<div class="rx-swatch" aria-hidden="true">' +
            sources.map((_, i) => '<i style="background:hsl(' + (i * 62) + ' 62% 56%)"></i>').join('') +
            '<span>a different palette every time</span></div>');
    }
    if (command.path === '/invite') {
        extras.push('<div class="rx-inst">' +
            '<div><b>On your account</b><p>Carries Dioreo into every server, DM and group chat you are in — ' +
            'including servers it has never joined.</p></div>' +
            '<div><b>On a server</b><p>Everyone there can use it, and nobody else has to install anything.</p></div>' +
            '</div>');
    }

    return '<section class="rx-p" tabindex="-1" id="' + esc(command.id) + '" ' +
        'style="' + colourVars(command.path, accents, derived ? DERIVED_NEUTRAL : null) + '" ' +
        'data-cmd="' + esc(command.path) + '"' +
        (tintOpt ? ' data-tint-opt="' + tintOpt + '" data-tint=\'' + JSON.stringify(tintTable) + '\'' : '') +
        (catTable ? ' data-cats=\'' + JSON.stringify(catTable) + '\'' : '') + '>' +
        '<div class="rx-card">' +
        '<p class="rx-eyebrow">' + esc(group.label) + '</p>' +
        '<p class="rx-name">' + slashName(command.path, C) + '</p>' +
        '<p class="rx-why">' + esc(entry.purpose || command.description) + '</p>' +
        renderFacts(entry, C) +
        runLine(command, C) +
        (options.length
            ? '<div class="rx-slots">' + options.map(o => (o.required
                ? renderRequired(o, command, C, tintOpt && o.name === tintOpt ? scopes : null)
                : renderOptional(o, command, C, tintOpt && o.name === tintOpt ? scopes : null))).join('') + '</div>'
            : '') +
        extras.join('') +
        '</div></section>';
}

/** One command as a card on the landing state — name, what it does, and what it takes. */
function homeCard(command, C, accents) {
    const { esc } = C;
    const entry = COMMANDS[command.path] || {};
    const derived = DERIVED.has(command.path);
    const opts = ownOptions(command).map(o =>
        '<span' + (o.required ? ' class="req"' : '') + '>' + esc(o.name) + '</span>').join('');
    return '<a class="rx-cd" href="#' + esc(command.id) + '" style="' +
        colourVars(command.path, accents, derived ? DERIVED_NEUTRAL : null) + '">' +
        '<span class="rx-cd-n"><i aria-hidden="true"></i>' + esc(command.path) + '</span>' +
        '<span class="rx-cd-w">' + esc(entry.purpose || command.description) + '</span>' +
        (opts ? '<span class="rx-cd-o">' + opts + '</span>' : '') +
        '</a>';
}

/**
 * Renders the whole page. `catalog` is scripts/lib/commandCatalog.js's output; `page` is the entry from buildLegalPages.js's page table.
 */
function commandsShell({ page, catalog, C }) {
    requireChrome(C);
    assertProseCoverage(catalog);
    assertAskCoverage(catalog);
    assertSearchCoverage(catalog);
    if (page.accent.toUpperCase() !== SIGNAL.dark.toUpperCase()) {
        throw new Error('commandsPage.js: TOOL_PAGES declares accent ' + page.accent + ' but SIGNAL.dark is ' +
            SIGNAL.dark + '. These feed the SAME colour by two routes, so a mismatch renders a pill and an ' +
            'Install button in two different shades. Change BRAND.signal, not this constant.');
    }
    const { esc } = C;
    const accents = loadAccents();
    const cats = loadCategoryAccents();
    const scopes = loadScopeAccents(cats);
    const weapons = loadWeaponIndex();

    if (!page.lede.includes(page.ledeEm)) {
        throw new Error('commandsPage.js: TOOL_PAGES ledeEm ' + JSON.stringify(page.ledeEm) +
            ' does not occur in lede ' + JSON.stringify(page.lede) + '.');
    }
    const ledeHtml = esc(page.lede).replace(esc(page.ledeEm), '<em>' + esc(page.ledeEm) + '</em>');

    const rail = [];
    const panels = [];
    const cards = [];
    const byPath = new Map();

    for (const group of catalog.groups) {
        if (!group.commands.length) continue;
        rail.push('<span class="rx-gl" aria-hidden="true">' + esc(group.label) + '</span>');
        for (const command of group.commands) {
            byPath.set(command.path, command);
            const derived = DERIVED.has(command.path);
            const vars = colourVars(command.path, accents, derived ? DERIVED_NEUTRAL : null);
            rail.push('<a class="rx-chip" href="#' + esc(command.id) + '" data-for="' + esc(command.id) + '" ' +
                'data-find="' + esc(searchHaystack(command, group.label)) + '" style="' + vars + '">' +
                '<i class="rx-dot" aria-hidden="true"></i>' + esc(command.path) + '</a>');
            panels.push(renderPanel(command, group, C, accents, cats, scopes));
            cards.push(homeCard(command, C, accents));
        }
    }

    const asks = ASKS.map(a => {
        const command = byPath.get(a.to);
        if (!command) throw new Error('commandsPage.js: the ask "' + a.q + '" points at ' + a.to + ', which the bot no longer registers.');
        const derived = DERIVED.has(a.to);
        return '<a class="rx-ask" href="#' + esc(command.id) + '" style="' +
            colourVars(a.to, accents, derived ? DERIVED_NEUTRAL : null) + '">' +
            '<i aria-hidden="true"></i><span>' + esc(a.q) + '</span><em>' + esc(a.to) + '</em></a>';
    }).join('');

    /* ⚠️ THIS SITE IS DARK-FIRST, and getting the polarity backwards is silent. The bare
       :root block IS the dark theme; light arrives as an override, BOTH as an explicit
       toggle and as a system preference with no toggle — three blocks, mirroring TOKENS.
       ⚠️ --accent stays the BRIGHT hue in both themes (it is a FILL); only --accent-t, the
       text-safe value, darkens for light, and it is HAND-TUNED because TOKENS' 38% formula
       desaturates a saturated hue toward mud. */
    const lightVars = '--accent-t:' + SIGNAL.light;
    const accent = ':root{--accent:' + esc(page.accent) + ';--glow:' + esc(page.glow) +
        ';--accent-on:' + solveOn(page.accent) + '}' +
        ':root[data-theme=light]{' + lightVars + '}' +
        '@media (prefers-color-scheme:light){:root:not([data-theme=dark]){' + lightVars + '}}' +
        '.rx-p,.rx-chip,.rx-ask,.rx-cd{--ci:var(--ct)}' +
        ':root[data-theme=light] .rx-p,:root[data-theme=light] .rx-chip,' +
        ':root[data-theme=light] .rx-ask,:root[data-theme=light] .rx-cd{--ci:var(--ctl)}' +
        '@media (prefers-color-scheme:light){:root:not([data-theme=dark]) .rx-p,' +
        ':root:not([data-theme=dark]) .rx-chip,:root:not([data-theme=dark]) .rx-ask,' +
        ':root:not([data-theme=dark]) .rx-cd{--ci:var(--ctl)}}';

    // Only the fields the page's autocomplete uses, so the inlined payload stays a few KB.
    const weaponPayload = JSON.stringify({
        MP: weapons.MP.map(w => ({ name: w.name, key: w.key, builds: w.builds, category: w.category,
            tint: cats[(w.category || '').toUpperCase()] || DERIVED_NEUTRAL })),
        DMZ: weapons.DMZ.map(w => ({ name: w.name, key: w.key, builds: w.builds })),
    }).replace(/</g, '\\u003C');

    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(page.title)} — Dioreo</title>
<meta name="description" content="${esc(page.desc)}">
${C.THEME_BOOT}
<style>${C.TOKENS}${C.COMPONENT_CSS}${C.BAR_CSS}${C.PAGE_CSS}${C.SLOT_CSS}${C.SWITCHER_CSS}${accent}${RECEIVER_CSS}</style>
</head><body>
<a class="skip" href="#main">Skip to content</a>
${C.GOO_SVG}
<!-- ⚠️ THE EXACT SHAPE shell() USES. The four controls belong in a <nav> (.bar nav
     margin-left:auto is what pushes them right), the content belongs in .page, and the
     footer is the LAST CHILD of .page. Do not flatten any of these back out. -->
<div class="bar">
  ${C.wordmark('./', page)}
  <nav>${C.navSwitcher(page)}${C.repoBtn}${C.installBtn()}${C.themeBtn()}</nav>
</div>
<!-- ⚠️ NO SECTION SLOTS ON PURPOSE: mobileNav() renders its "On this page" accordion only
     when given some, and this page's rail already IS that navigation. -->
${C.mobileNav(page, '')}
<div class="page rx-floor">
<main id="main" tabindex="-1">
  <header class="rx-top">
    <h1 class="rx-h1">${esc(page.title)}</h1>
    <p class="rx-sub">${ledeHtml}</p>
  </header>

  <div class="rx-rail">
    <nav class="rx-scroll" aria-label="All commands">
      <a class="rx-chip rx-home-chip" id="rx-homechip" href="#"><i class="rx-dot" aria-hidden="true"></i>All commands</a>
      ${rail.join('')}
    </nav>
  </div>

  <div class="rx-bench" id="rx-bench">
    <label class="rx-sr" for="rx-q">Search commands</label>
    <input class="rx-sr" id="rx-q" type="search" placeholder="Search" autocomplete="off" spellcheck="false">
    <!-- WCAG 4.1.3. Filtering hides rail chips, and without a status region a screen-reader
         user gets no signal that the strip changed. Polite, and EMPTY at rest. -->
    <p class="rx-none" id="rx-count" role="status"></p>

    <div class="rx-stage">
      ${panels.join('')}
      <section class="rx-home" tabindex="-1">
        <div class="rx-card" style="--cc:var(--accent);--con:var(--accent-on)">
          <h2>Every command</h2>
          <p class="rx-lead">Pick one to see what it takes, fill it in, and copy the line into Discord.</p>
          <div class="rx-cards">${cards.join('')}</div>
          <p class="rx-asks-h">Or start from what you want</p>
          <p class="rx-asks-s">Each of these is one command.</p>
          <div class="rx-asks">${asks}</div>
        </div>
      </section>
    </div>
  </div>
</main>
  ${C.pageFoot(page, null, false)}
</div>
<!-- ⚠️ A REAL JS ASSIGNMENT, NOT type="application/json". The build parses every inline
     script as JavaScript, and a bare object literal reads as a labelled block, so a JSON
     script tag fails the gate with "Unexpected token ':'" — correctly, since the gate cannot
     know the type attribute changes the language. -->
<script>window.__RX_WEAPONS=${weaponPayload};</script>
<!-- Outside .page: a fixed element is trapped by any ancestor with a transform or a filter. -->
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
    VISIBLE_CHOICES, ownOptions, solveText, solveOn, darken,
    loadAccents, loadCategoryAccents, loadScopeAccents, loadWeaponIndex,
    DERIVED, DERIVED_NEUTRAL, GROUND_DARK, GROUND_LIGHT,
};
