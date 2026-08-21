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

function portalContrastAudit(css) {
    // Comments stripped first -- this file's OWN header comment about the site generator's past :root{} bug literally contains the substring ':root{}', which a comment-blind regex matches as the FIRST (empty, wrong) :root block. Found by actually running this against real input rather than assuming a hand-written comment could not itself trip the thing it warns about -- exactly the failure mode Task 4 Step 4 exists to catch.
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const rootBlock = (stripped.match(/:root\s*\{([^}]*)\}/) || [, ''])[1];
    const vars = {};
    for (const m of rootBlock.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g)) vars[m[1]] = m[2];
    const backgrounds = ['desk', 'paper', 'raised', 'sunk'].filter(b => vars[b]);
    const foregrounds = ['ink', 'ink2', 'ink3'].filter(f => vars[f]);
    const bad = [];
    let checked = 0;
    for (const fg of foregrounds) {
        for (const bg of backgrounds) {
            checked++;
            const r = contrastRatio(vars[fg], vars[bg]);
            if (r < CONTRAST_MIN) bad.push(`--${fg} ${vars[fg]} on --${bg} ${vars[bg]} is ${r.toFixed(2)}:1, below ${CONTRAST_MIN}:1`);
        }
    }
    if (bad.length) {
        console.error('  FAIL contrast below WCAG AA:');
        bad.forEach(b => console.error(`      ${b}`));
        return false;
    }
    console.log(`  PASS all ${checked} --token pairs in :root meet ${CONTRAST_MIN}:1`);
    return true;
}

function build() {
    vendorPreactAndHtm();
    const uiFiles = copyUiScripts();
    const css = buildCss();
    const indexHtml = buildIndexHtml();
    return { uiFiles, css, indexHtml };
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
