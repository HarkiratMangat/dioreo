// scripts/buildPortal.js
//
// Emits portal/public/** — the portal's built frontend. No bundler (spec decision 6): this copies portal/ui/*.js verbatim for the browser to load as native ESM, and vendors Preact + htm as real devDependencies (installed via npm so dep-licences can see them — a file just copied into portal/public/ would be invisible to it, the exact "fails open" shape the plan's R2 finding warns about) rather than writing its own bundle.
const fs = require('fs');
const path = require('path');
// 🔴 FALSIFIED, NOT REUSED. The plan's Task 4 Step 3 said to run scripts/buildLegalPages.js's own `contrastAudit()` over the portal's CSS — tested by actually calling it (`for (const page of built)` throws TypeError on anything but an array of the site's own page objects, and it reads bytes from disk via that generator's `outPath()`/`dirOf()`, then checks only ITS OWN hardcoded variable names: `--desk`/`--card`/`--sig`/`--ink`/`--ink2`/`--ink3`). None of that matches the portal's token vocabulary (`--paper`/`--raised`/`--patch`/`--warn`/`--ok`) or its single-CSS-file shape. Reusing it as written is not possible without reshaping the portal to pretend to be a legal-site page. So this file re-implements the SAME WCAG luminance/ratio math (below), scoped to the portal's own :root block, rather than a call that would either throw or silently check the wrong variables under a name that implies real reuse.

const ROOT = path.join(__dirname, '..');
const UI_DIR = path.join(ROOT, 'portal', 'ui');
const OUT_DIR = path.join(ROOT, 'portal', 'public');
const VENDOR_OUT = path.join(OUT_DIR, 'vendor');
const UI_OUT = path.join(OUT_DIR, 'ui');

function copyFile(src, dest) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
}

function vendorPreactAndHtm() {
    copyFile(path.join(ROOT, 'node_modules', 'preact', 'dist', 'preact.module.js'), path.join(VENDOR_OUT, 'preact.mjs'));
    copyFile(path.join(ROOT, 'node_modules', 'htm', 'dist', 'htm.module.js'), path.join(VENDOR_OUT, 'htm.mjs'));
    // preact/hooks imports the bare specifier 'preact' (import{options as n}from'preact';), which no real browser resolves without an import map. Rewriting it to a relative path at vendor time is simpler and more portable than shipping an <script type=importmap> for one dependency.
    const hooksSrc = fs.readFileSync(path.join(ROOT, 'node_modules', 'preact', 'hooks', 'dist', 'hooks.module.js'), 'utf8');
    fs.mkdirSync(VENDOR_OUT, { recursive: true });
    fs.writeFileSync(path.join(VENDOR_OUT, 'preact-hooks.mjs'), hooksSrc.replace(/from"preact"/, 'from"./preact.mjs"'));
    // htm ships unbound — `htm.bind(h)` is the documented way to pair it with a specific h(). Hand -written rather than resolved through htm/preact's own submodule, which does a bare-specifier `import 'preact'` that has no meaning to a browser with no import map.
    const binding = "import { h } from './preact.mjs';\nimport htm from './htm.mjs';\nexport const html = htm.bind(h);\n";
    fs.writeFileSync(path.join(VENDOR_OUT, 'htm-preact.mjs'), binding);
}

function copyUiScripts() {
    fs.mkdirSync(UI_OUT, { recursive: true });
    const files = fs.readdirSync(UI_DIR).filter(f => f.endsWith('.js'));
    for (const f of files) copyFile(path.join(UI_DIR, f), path.join(UI_OUT, f));
    return files;
}

function buildCss() {
    // Every portal/ui/*.css file, tokens first so downstream component styles can use its custom properties. Concatenation, not a preprocessor — there is nothing here a bundler would buy.
    const files = fs.readdirSync(UI_DIR).filter(f => f.endsWith('.css'));
    files.sort((a, b) => (a === 'tokens.css' ? -1 : b === 'tokens.css' ? 1 : a.localeCompare(b)));
    const css = files.map(f => fs.readFileSync(path.join(UI_DIR, f), 'utf8')).join('\n\n');
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, 'app.css'), css);
    return css;
}

// 🔴 THE PORTAL DECLARED TWO TYPEFACES AND LOADED NEITHER, from the first build until 2026-08-23. tokens.css sets `font-family:'Space Grotesk'...` on body and `'JetBrains Mono'` on every data cell, and this file emitted exactly one <link> — /app.css. No @font-face rule existed anywhere and document.fonts.size read 0. The gap audit's §6 listed type under "what's already working ... no gap here", which is how it survived: the fallback stacks are good enough that nothing looked broken. The falsifier that settled it: render the same 40px string in "Space Grotesk" and in "JetBrains Mono" and compare widths — a real proportional sans and a real monospace face cannot measure the same, and both measured 579.87px while sans-serif measured 606.88 and monospace 746.55. Both were falling through to one last-resort face.
//
// ⚠️ The fallback stacks in tokens.css stay exactly as they are on purpose: a blocked or offline font load degrades to what shipped before this change rather than to nothing, and `display=swap` means text is never invisible while the fetch is in flight.
function buildIndexHtml() {
    // Every *.logic.js file loads as a CLASSIC script (no type=module) BEFORE app.js, so its top-level function declarations become globals — see track.js's header comment for why this is the actual working resolution of "Node reads it as CommonJS, the browser reads the same file as a plain script", rather than a literal cross-format ESM import that no real browser could execute.
    const logicFiles = fs.readdirSync(UI_DIR).filter(f => f.endsWith('.logic.js')).sort();
    const logicTags = logicFiles.map(f => `<script src="/ui/${f}"></script>`).join('\n');
    const htmlOut = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Dioreo Admin Portal</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap">
<link rel="stylesheet" href="/app.css">
</head>
<body>
<div id="app"></div>
${logicTags}
<script type="module" src="/ui/app.js"></script>
</body>
</html>
`;
    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, 'index.html'), htmlOut);
    return htmlOut;
}

const CONTRAST_MIN = 4.5;

// The same WCAG relative-luminance/contrast-ratio math scripts/buildLegalPages.js's contrastAudit() uses -- reimplemented here (not imported; see the note above) because that function is wired to the site generator's page objects and its own three variable names, neither of which fit a single portal CSS file with a different palette.
function contrastRatio(hexA, hexB) {
    const srgb = c => (c /= 255) <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const lum = h => {
        const n = h.length === 4 ? '#' + [1, 2, 3].map(i => h[i] + h[i]).join('') : h;
        const [r, g, b] = [1, 3, 5].map(i => parseInt(n.slice(i, i + 2), 16));
        return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
    };
    const [x, y] = [lum(hexA), lum(hexB)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
}

// Resolve a CSS value that may be a var() chain with fallbacks down to a literal hex, using the :root token table. `var(--a, var(--b))` resolves to --a when --a is DEFINED IN :root, and to the fallback when it is not -- which is the whole mechanism behind the login-button bug: --topic-accent is set 0 times in CSS and 4 times inline from JS, so on any element JS did not stamp, all 14 of its fallback references resolve to the fallback. Returns null for anything not reducible to a hex (gradients, rgba(), currentColor) -- those are not this checker's business and a guess would be worse than a skip.
function resolveColorValue(value, vars, depth = 0) {
    if (!value || depth > 6) return null;
    const v = value.trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return v.length === 4
        ? '#' + v.slice(1).split('').map(c => c + c).join('')
        : v.slice(0, 7);
    const m = v.match(/^var\(\s*(--[\w-]+)\s*(?:,([\s\S]+))?\)$/);
    if (!m) return null;
    const name = m[1].slice(2), fallback = m[2];
    if (vars[name]) return resolveColorValue(vars[name], vars, depth + 1);
    return fallback ? resolveColorValue(fallback, vars, depth + 1) : null;
}

function portalContrastAudit(css) {
    // Comments stripped first -- this file's OWN header comment about the site generator's past :root{} bug literally contains the substring ':root{}', which a comment-blind regex matches as the FIRST (empty, wrong) :root block. Found by actually running this against real input rather than assuming a hand-written comment could not itself trip the thing it warns about -- exactly the failure mode Task 4 Step 4 exists to catch.
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const rootBlock = (stripped.match(/:root\s*\{([^}]*)\}/) || [, ''])[1];
    const vars = {};
    for (const m of rootBlock.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g)) vars[m[1]] = m[2];
    const backgrounds = ['desk', 'paper', 'raised', 'sunk'].filter(b => vars[b]);
    const foregrounds = ['ink', 'ink2', 'ink3'].filter(f => vars[f]);
    // 🔴 SIGNAL COLOURS ARE CHECKED TOO, and they were the gap. This audit used to pair ONLY ink/ink2/ink3 against the four surfaces -- 12 pairs -- so every colour used as text that is not an ink token was invisible to it. The portal mockup-vs-live gap audit filed that as its §8 finding, and on 2026-08-23 it bit for real: a new Analytics kind-chip borrowed --ret (a Season TOPIC accent, designed to be a bar FILL) as chip text and measured 4.15:1 on --sunk. Nothing failed. Adding the pair below is not the whole of §8 -- that asks for computed contrast on rendered elements, which would also catch a var() fallback chain -- but it closes the half that is checkable from the token file alone, which is where this one lived.
    const SIGNAL_TEXT_ON = { patch: ['desk', 'raised', 'sunk'], warn: ['paper', 'raised', 'sunk'], ok: ['paper', 'sunk'], staged: ['paper', 'raised', 'sunk'], info: ['sunk'] };
    const bad = [];
    let checked = 0;
    for (const fg of foregrounds) {
        for (const bg of backgrounds) {
            checked++;
            const r = contrastRatio(vars[fg], vars[bg]);
            if (r < CONTRAST_MIN) bad.push(`--${fg} ${vars[fg]} on --${bg} ${vars[bg]} is ${r.toFixed(2)}:1, below ${CONTRAST_MIN}:1`);
        }
    }
    for (const [fg, surfaces] of Object.entries(SIGNAL_TEXT_ON)) {
        if (!vars[fg]) continue;
        for (const bg of surfaces) {
            if (!vars[bg]) continue;
            checked++;
            const r = contrastRatio(vars[fg], vars[bg]);
            if (r < CONTRAST_MIN) bad.push(`--${fg} ${vars[fg]} used as TEXT on --${bg} ${vars[bg]} is ${r.toFixed(2)}:1, below ${CONTRAST_MIN}:1`);
        }
    }

    // 🔴 PASS 2 -- REAL RULES, NOT JUST TOKEN PAIRS. Everything above checks the token table; this checks what the stylesheet actually declares, which is where the login button's ~1.3:1 lived (`.accent-fill{background:var(--topic-accent,var(--raised));color:var(--on-accent)}` -- both halves legitimate tokens, the PAIR unreadable, and no token-pair audit can see that).
    //
    // Two cases, and the split is what keeps this free of false positives:
    //   A. the rule declares BOTH color and background -> that pair is self-contained, check it.
    //   B. the rule declares color and NO background -> it inherits one, and CSS alone cannot say
    //      which. Checked against --raised, the LIGHTEST portal surface, which is the worst case for
    //      light-on-dark text and therefore a conservative bound rather than a guess.
    // Values that do not reduce to a hex (gradients, rgba, currentColor) are skipped, not guessed.
    const stripped2 = stripped.replace(/@media[^{]*\{/g, '').replace(/@keyframes[^{]*\{[\s\S]*?\}\s*\}/g, '');
    const LIGHTEST_SURFACE = vars.raised;
    for (const rule of stripped2.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        const selector = rule[1].trim().replace(/\s+/g, ' ');
        const body = rule[2];
        if (!selector || selector.startsWith('@') || selector.startsWith(':root')) continue;
        const fgDecl = body.match(/(?:^|;)\s*color\s*:\s*([^;]+)/);
        if (!fgDecl) continue;
        const fg = resolveColorValue(fgDecl[1], vars);
        if (!fg) continue;
        const bgDecl = body.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/);
        const bg = bgDecl ? resolveColorValue(bgDecl[1], vars) : LIGHTEST_SURFACE;
        if (!bg) continue;
        checked++;
        const r = contrastRatio(fg, bg);
        if (r < CONTRAST_MIN) {
            bad.push(bgDecl
                ? `${selector} declares ${fg} on ${bg} — ${r.toFixed(2)}:1, below ${CONTRAST_MIN}:1`
                : `${selector} declares ${fg} and inherits its background — ${r.toFixed(2)}:1 on the lightest surface ${bg}, below ${CONTRAST_MIN}:1`);
        }
    }

    if (bad.length) {
        console.error('  FAIL contrast below WCAG AA:');
        bad.forEach(b => console.error(`      ${b}`));
        return false;
    }
    console.log(`  PASS all ${checked} colour pairs (tokens + declared rules) meet ${CONTRAST_MIN}:1`);
    return true;
}

const MOCKUP_ASSETS = path.join(ROOT, 'docs', 'superpowers', 'mockups', '2026-08-23-portal-interactive');

// The FIXTURE HARNESS — portal/public/harness.html. A page the SERVER NEVER SERVES: portal/server.js routes every non-/api non-/auth GET through serveStatic, so this is reachable only through the repo-static config in .claude/launch.json (:8900) or any plain file server. It exists so design work on the real components needs no Mongo, no Discord OAuth and no session — the components are pure (spec §12a) and the only thing standing between them and a browser was the data.
//
// It does NOT stub by branching inside httpClient.js. The page declares an import map aliasing /ui/httpClient.js to /harness/stub.js, so the alias exists only in a page production never loads.
//
// ⚠️ fixtures.js and the two instruments are still SOURCED FROM THE MOCKUP PACKAGE. That is the one remaining dependency on it and it is deliberate: copying 135KB of fixtures into git twice during a migration is how the two copies drift. When the mockup package retires (see docs/superpowers/specs/2026-08-25-portal-preact-migration-design.md) these three files move into portal/ui/harness/ and this function's paths change with them.
function buildHarness() {
    // 🔴 A CACHE BUSTER, BECAUSE A PLAIN RELOAD SERVED STALE MODULES. The harness page is sent with `no-store`, but the browser's ES MODULE MAP is keyed by URL and survives a reload — so edited components kept rendering their previous version and a verification pass looked at code that was no longer on disk. Measured: the season identity strip and the rebuilt staged strip both reported ABSENT on a fresh navigation while sitting in the built file.
    const bust = Date.now();

    const HARNESS_SRC = path.join(UI_DIR, 'harness');
    if (!fs.existsSync(HARNESS_SRC)) return null;
    const HARNESS_OUT = path.join(OUT_DIR, 'harness');
    fs.mkdirSync(HARNESS_OUT, { recursive: true });
    copyFile(path.join(HARNESS_SRC, 'stub.js'), path.join(HARNESS_OUT, 'stub.js'));
    for (const [src, dest] of [
        ['assets/fixtures.js', 'fixtures.js'],
        ['.peers.js', 'peers.js'],
        ['.grid.js', 'grid.js'],
    ]) {
        const from = path.join(MOCKUP_ASSETS, src);
        if (fs.existsSync(from)) copyFile(from, path.join(HARNESS_OUT, dest));
    }
    // The same classic-script logic tags index.html emits, for the same reason — *.logic.js must define its globals before app.js's module graph evaluates.
    const logicTags = fs.readdirSync(UI_DIR).filter(f => f.endsWith('.logic.js')).sort()
        .map(f => `<script src="/ui/${f}?v=${bust}"></script>`).join('\n');
    const page = fs.readFileSync(path.join(HARNESS_SRC, 'index.html'), 'utf8')
        .replace('__LOGIC__', logicTags)
        .replace('/ui/app.js', `/ui/app.js?v=${bust}`)
        .replace('/harness/stub.js', `/harness/stub.js?v=${bust}`)
        .replace('"/ui/httpClient.js"', `"/ui/httpClient.js?v=${bust}"`);
    fs.writeFileSync(path.join(OUT_DIR, 'harness.html'), page);
    return page;
}

function build() {
    vendorPreactAndHtm();
    const uiFiles = copyUiScripts();
    const css = buildCss();
    const indexHtml = buildIndexHtml();
    const harness = buildHarness();
    return { uiFiles, css, indexHtml, harness };
}

function runCli() {
    const { css } = build();
    console.log(`Built portal/public/ (${fs.readdirSync(UI_OUT).length} UI scripts, app.css, vendor/, index.html)`);
    console.log('\nChecking portal CSS custom-property contrast (WCAG AA):');
    const ok = portalContrastAudit(css);
    if (!ok) process.exitCode = 1;
}

if (require.main === module) { runCli(); }
module.exports = { build, vendorPreactAndHtm, copyUiScripts, buildCss, buildIndexHtml, portalContrastAudit, contrastRatio };
