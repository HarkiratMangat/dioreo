// scripts/portalStates.mjs — THE STATES HARNESS: walk every state a surface can be in, and check the three things only a rendered page can answer.
//
// 🔴 IT IS THE DRIVER FOR A CATALOGUE THAT GROWS, NOT A FIXED LIST. `.states.html` in the mockup package enumerated the states the mockup happened to have, which means it inherited the mockup's blind spots — 4b EXPANDED exists precisely because "the sweep had only ever rendered the default state". So Part 0 builds the driver and the discipline; every realm REGISTERS the states it discovers while walking, in `portal/fixtures/states/<realm>.json`; Part 7 re-runs everything through the finished catalogue. That makes "did I walk every state?" a question you answer by diffing the registry against the walk, instead of a sentence in a summary that nobody can check.
//
// 🔴 THE PASSES ARE RELATIONAL BY DESIGN — see scripts/lib/portalStatePasses.cjs. PASS 1 composite (a control drawing a second box inside its wrapper), PASS 3 space (content clipped to nothing, a page that scrolls sideways), PASS 4 keyboard (a visible control no Tab reaches, and a "modal" Tab walks out of). There is no PASS 2, and a session WILL go looking for it: the mockup's numbering ran 1, 3, 4, 5.
//
// ⚠️ PASS 5 (reduced motion) IS NOT IMPLEMENTED HERE and is not silently missing: emulating the media query is easy, but every honest assertion about it is about what CSS DECLARES, which a rendered walk is the wrong instrument for. It is Part 7's, with the rest of motion-as-a-system.
//
//   node scripts/portalStates.mjs                    walk every registered state
//   node scripts/portalStates.mjs --realm shell      one registry
//   node scripts/portalStates.mjs --ci               fail on a finding no registry entry knows about
//   node scripts/portalStates.mjs --record           write today's findings into each state's `known` list
import fs from 'fs';
import http from 'http';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { runPasses, diffAgainstKnown, keyOf, stepSettle } = require('./lib/portalStatePasses.cjs');
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'portal', 'public');
const REGISTRY = path.join(ROOT, 'portal', 'fixtures', 'states');
const VIEWPORT = { w: 1282, h: 888 };

function serve() {
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
    const server = http.createServer((req, res) => {
        const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'harness.html';
        const file = path.join(PUBLIC, rel);
        if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
        res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store, must-revalidate' });
        res.end(fs.readFileSync(file));
    });
    return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}

// Everything the page can see, reduced to the records the passes need. It returns CANDIDATES, not the whole DOM — a thousand element records would make every run a wall of JSON nobody reads.
const COLLECT = function () {
    const idOf = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
    const paints = (cs) => parseFloat(cs.borderTopWidth) > 0 || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent');
    const visible = (el) => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length > 0; };

    const controls = [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]),select,textarea')]
        .filter(visible)
        .map((el) => {
            const cs = getComputedStyle(el), p = el.parentElement, ps = p && getComputedStyle(p);
            const r = el.getBoundingClientRect(), pr = p && p.getBoundingClientRect();
            return {
                id: idOf(el), h: Math.round(r.height), parentH: pr ? Math.round(pr.height) : 0,
                border: Math.round(parseFloat(cs.borderTopWidth) || 0), bg: cs.backgroundColor,
                selfPaintsBg: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent',
                parentPaints: !!(ps && paints(ps)),
            };
        });

    // ⚠️ HIDDEN IS NOT CLIPPED, and conflating them made the first run report nineteen defects that were all the account menu's own collapsed items. A closed panel's contents measure 0x0 for the ordinary reason that they are not being shown. `checkVisibility()` answers the question the pass is actually asking — is this element being rendered — including a `display:none` or `[hidden]` ANCESTOR, which an element-local `display` read cannot see.
    const rendered = (el) => (el.checkVisibility ? el.checkVisibility({ checkVisibilityCSS: true }) : el.getClientRects().length > 0);
    const clipped = [...document.querySelectorAll('main *, header *, .rail *')]
        .filter((el) => el.children.length === 0 && (el.textContent || '').trim().length > 3 && rendered(el))
        .map((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { el, r, cs }; })
        .filter(({ r }) => r.height <= 1 || r.width <= 1)
        .map(({ el, r, cs }) => ({
            id: idOf(el), w: Math.round(r.width), h: Math.round(r.height), textLen: el.textContent.trim().length,
            // the visually-hidden pattern is this shape ON PURPOSE — 1px, clipped, off in the margin
            srOnly: /(^|\s)sr(\s|$)/.test(el.className || '') || cs.clip === 'rect(0px, 0px, 0px, 0px)' || cs.clipPath === 'inset(50%)' || parseFloat(cs.marginTop) <= -1,
        }));

    // 🔴 WHAT PASS 6 READS. Two ELEMENT children adjacent in `childNodes` means no text node sits between them, which means no space — a whitespace-only text node would be a node, so its absence is the whole test and nothing has to guess at the markup. Elements carrying an explicit `aria-label` or `aria-labelledby` are skipped: those win over name-from-contents, so the fused text is never announced.
    const NAME_FROM_CONTENTS = 'button,a[href],[role="button"],[role="link"],[role="tab"],[role="menuitem"],h1,h2,h3,h4,h5,h6,summary,label';
    const fusedNames = [...document.querySelectorAll(NAME_FROM_CONTENTS)]
        .filter(visible)
        .filter((el) => !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby'))
        .map((el) => {
            // 🔴 IT RECURSES, AND IT SKIPS `aria-hidden`. The first version did neither, and each mistake pointed the opposite way. Looking only at DIRECT children missed the seam inside Home's `.att-x`, where `<b>` abuts `<em>` two levels down — the fused string was in the announced name the run printed while the seam list said nothing about it. And counting `aria-hidden` children INVENTED one: `.att-i` holds the row number "01" and is hidden from the accessibility tree, so it is in `textContent` and in no screen reader's output. A pass that reports a seam nobody can hear is the false positive that gets a gate suppressed rather than obeyed, and a pass that misses a real one is decoration.
            const named = (n) => n.nodeType === 1 && n.getAttribute('aria-hidden') !== 'true';
            // Defined before the walk because the SEAM EVIDENCE is quoted back to a reader who will go looking for those exact words, and `textContent` would put an aria-hidden arrow into a string describing what a screen reader says.
            const spoken = (node) => [...node.childNodes]
                .filter((n) => n.nodeType !== 1 || named(n))
                .map((n) => (n.nodeType === 1 ? spoken(n) : (n.textContent || ''))).join('');
            const joins = [];
            const walk = (node) => {
                const kids = [...node.childNodes].filter((n) => n.nodeType !== 1 || named(n));
                for (let i = 0; i < kids.length - 1; i++) {
                    if (kids[i].nodeType !== 1 || kids[i + 1].nodeType !== 1) continue;
                    const a = spoken(kids[i]).trim(), b = spoken(kids[i + 1]).trim();
                    if (!a || !b) continue;
                    if (/[A-Za-z0-9]$/.test(a) && /^[A-Za-z0-9]/.test(b)) joins.push(a.slice(-14) + '\u205e' + b.slice(0, 14));
                }
                for (const k of kids) if (k.nodeType === 1) walk(k);
            };
            walk(el);
            return joins.length ? { id: idOf(el), name: spoken(el).replace(/\s+/g, ' ').trim().slice(0, 70), joins } : null;
        })
        .filter(Boolean);

    const overflow = [...document.querySelectorAll('body, main, header, .rail, .panel, .app')]
        .filter((el) => el.scrollWidth - el.clientWidth > 1 && getComputedStyle(el).overflowX === 'visible')
        .map((el) => ({ id: idOf(el), scrollW: el.scrollWidth, clientW: el.clientWidth, overflowX: getComputedStyle(el).overflowX }));

    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]';
    const focusables = [...document.querySelectorAll(FOCUSABLE)].filter(visible);
    const unreachable = focusables
        .filter((el) => el.getAttribute('tabindex') === '-1' && el.tagName !== 'DIV' && !el.closest('[hidden]'))
        .map((el) => ({ id: idOf(el), tag: el.tagName.toLowerCase(), role: el.getAttribute('role'), why: 'tabindex="-1"' }));

    // What is actually MOVING. Judged only when the state asked for reduced motion — see PASS 5.
    const animations = document.getAnimations()
        .filter((a) => a.playState === 'running')
        .map((a) => {
            const t = (a.effect && a.effect.getTiming) ? a.effect.getTiming() : {};
            const el = a.effect && a.effect.target;
            return { name: a.animationName || 'animation', duration: Number(t.duration) || 0, iterations: t.iterations === Infinity ? null : t.iterations, el: el ? idOf(el) : '(detached)' };
        });

    const dialog = document.querySelector('[role=dialog]:not([hidden]), .drawer.open, .overlay.open, .modal.open');
    const modal = dialog
        ? {
            open: true, kind: dialog.className || 'dialog',
            escapees: focusables
                .filter((el) => !dialog.contains(el) && !el.closest('[inert]') && el.getAttribute('tabindex') !== '-1')
                .slice(0, 12)
                .map((el) => ({ id: idOf(el) })),
        }
        : { open: false, escapees: [] };

    return { controls, clipped, overflow, unreachable, modal, animations, fusedNames, counts: { controls: controls.length, focusables: focusables.length, elements: document.querySelectorAll('main *').length } };
};

// 🔴 EXPORTED AND NARROW ON PURPOSE. The retry below re-runs a state whose subject never appeared, and the ONE thing that must not happen is retrying a genuine crash -- a TypeError inside a pass would be run twice, could pass the second time, and would then be reported as a race. So the predicate matches only the two sentences this file itself throws for an unreached subject, and its test proves it is silent on everything else.
export function isStall(message) {
    return /did not reach its own subject|stalled: nothing matched/.test(String(message || ''));
}

async function walk(page, state, port) {
    // ⚠️ SET BEFORE THE NAVIGATION, and cleared for every state that did not ask — an emulated media feature is sticky on the page, so one reduced-motion state would silently put every state after it into reduced motion and their clean results would mean something else entirely.
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: state.reduceMotion ? 'reduce' : 'no-preference' }]);
    const q = new URLSearchParams(state.flags || {});
    q.set('b', String(Date.now()));
    await page.goto(`http://127.0.0.1:${port}/harness.html?${q}#/${state.realm || 'home'}`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);                                     // never rAF: it does not fire off-screen, and a pass gated on it reports pending forever
    await page.waitForSelector('main', { timeout: 15000 });
    // ⚠️ `slow` DELAYS THE FIRST LOAD TOO, so a state that injects it and then clicks something immediately clicks into a skeleton. `preSettleMs` waits for the data to arrive BEFORE the steps run — which is the whole point of the refreshing state: it only exists when there is already data on screen to keep.
    if (state.preSettleMs) await page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), state.preSettleMs);
    for (const step of state.steps || []) {
        if (step.key) await page.evaluate((k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k.key, metaKey: !!k.meta, bubbles: true })), step);
        if (step.click) await page.evaluate((s) => { const el = document.querySelector(s); if (el) el.click(); }, step.click);
        // ⚠️ A MENU ITEM IS IDENTIFIED BY ITS WORDS, NOT ITS POSITION. `.who [role=menuitem]` matched the FIRST item — "What you can do", which navigates away — so the state named "toast after an account action" walked to a different realm and reported clean. A registry that addresses controls positionally breaks every time a menu gains an entry, silently.
        if (step.clickText) await page.evaluate((s) => { const el = [...document.querySelectorAll(s.sel)].find((x) => (x.textContent || '').includes(s.text)); if (el) el.click(); }, step.clickText);
        // ⚠️ A TOOLTIP IS CONTENT AND IS INVISIBLE TO A SCREENSHOT, so the runtime that renders it has to be walked like any other state. tips.js delegates from the document, so a synthetic pointerover on the host is what a real pointer would produce.
        if (step.hover) await page.evaluate((sel) => { const el = document.querySelector(sel); if (el) { el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); } }, step.hover);
        // ⚠️ `type` ACCEPTS BOTH SHAPES, and it did not until 2026-08-28. Every other step that needs two values nests them (`clickText: {sel, text}`), so a registry written by hand naturally writes `type: {sel, text}` — which this read as `step.sel`/`step.text`, found undefined, and typed nothing into nothing. The step then "ran", and only `expect` reported that the state had not been reached. Cost a real debugging loop; a driver that accepts the shape its own siblings teach costs nothing.
        if (step.type) {
            const t = (typeof step.type === 'object') ? step.type : step;
            await page.evaluate((s) => { const el = document.querySelector(s.sel); if (el) { el.value = s.text; el.dispatchEvent(new Event('input', { bubbles: true })); } }, { sel: t.sel, text: t.text });
        }
        // ⚠️ 160ms IS A DEFAULT, NOT A CONTRACT. A step whose effect is a re-render that MOUNTS the next step's target needs longer, and when it does not get it the following step clicks nothing — which `expect` then reports as "did not reach its own subject". That is the gate working, but the state is still unwalked, so a step may name its own settle. Season's "closed again from the header's dead space" is the case: the first click mounts `.idbody`, and `.idhead` does not exist until it has.
        const settle = stepSettle(step);
        if (settle.until) {
            // A puppeteer TimeoutError says only "waiting for selector failed", which names neither the state nor which of its steps stalled - so it is caught and re-thrown in the same voice as the `expect` failure below, which is the message a reader already knows how to act on.
            try {
                await page.waitForSelector(settle.until, { timeout: settle.timeoutMs });
            } catch {
                throw new Error(`state "${state.name}" stalled: nothing matched ${settle.until} within ${settle.timeoutMs}ms after its step ran, so the next step would have clicked nothing`);
            }
        }
        if (settle.sleepMs) await page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), settle.sleepMs);
    }
    // A state can declare its own settle time. The slow state is the reason: it exists to be measured WHILE the request is still out, so waiting for the data would destroy the very thing being walked.
    if (state.settleMs) await page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), state.settleMs);
    // 🔴 `expect` IS WHAT MAKES A REGISTERED STATE A STATE RATHER THAN A CLAIM. The export-strip entry clicked `.mh-take` — which is the role="group" WRAPPER, not the toggle inside it — so the walk opened nothing, examined the default view, and reported a clean pass under the name of a state it had never reached. Five states were vacuous the same way for one run. A state that names the element its own steps are supposed to produce cannot lie about having got there. 🔴 IT WAITS FOR THE SUBJECT, IT DOES NOT SNAPSHOT FOR IT. This was a single `querySelector` taken immediately after the fixed settle above, which made the whole gate a coin flip: measured 2026-08-31, three consecutive `--ci` runs went fail / pass / fail with a DIFFERENT state each time (`identity · closed again`, `default · home`, `one-way panel · tier 3`, `command bar open`, `export strip open`). Roughly half of all local suite runs were red for reasons unrelated to the change under test — worse than a broken gate, because it trains a session to re-run until green and then believe the green. A fixed 700ms delay had already been tried as a remedy on 2026-08-30 and was evidently not enough; a DEADLINE is the right shape because a slow render costs only the time it needs while a genuinely unreached subject still fails, just 12s later. ⚠️ 4000 was the first value and it was still too tight -- 1 failure in 8 full runs, on `manifest selection bar` waiting for `.selbar.on`. A deadline costs nothing while it passes, since waitForSelector returns the instant the node appears, so the only argument for a small number is impatience. ⚠️ THE FAILURE MEANING IS UNCHANGED, which is the whole point of catching the timeout rather than letting puppeteer's own TimeoutError through: a state that never reaches its subject still fails, with the same sentence a reader already knows how to act on.
    let expected = true;
    if (state.expect) {
        try {
            // 🔴 RAISED 12000 → 45000 on 2026-09-01, and the argument is this file's own: "A deadline costs nothing while it passes, since waitForSelector returns the instant the node appears, so the only argument for a small number is impatience." 4000 was too tight, then 12000 was — measured 2026-09-01 inside a full `npm test`, where "export strip open" and then "command bar open" each timed out on a machine running several puppeteer instances, and both passed immediately when the walk was run alone. Those two names are already in this file's own flake list, so the remedy was known and the number was simply still low. ⚠️ THE FAILURE MEANING IS UNCHANGED: a state that never reaches its subject still fails, 45s later.
            await page.waitForSelector(state.expect, { timeout: 45000 });
        } catch {
            expected = false;
        }
    }
    if (!expected) throw new Error(`state "${state.name}" did not reach its own subject — nothing matches ${state.expect} within 45s after its steps ran, so a clean result would be a clean result for the DEFAULT view`);

    // 🔴 A PROBE MUST BE ABLE TO REPORT PRESENCE BEFORE AN ABSENCE MEANS ANYTHING. A run that walked to a page the SPA had not routed yet returned all-zeroes and read as a clean sweep, so a state that finds nothing to examine is an ERROR here, not a pass.
    const records = await page.evaluate(COLLECT);
    records.reducedMotion = Boolean(state.reduceMotion);
    if (state.reduceMotion) {
        const applied = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
        if (!applied) throw new Error(`state "${state.name}" asked for reduced motion and the page does not report it — the pass would have examined the ordinary state and called it clean`);
    }
    // ⚠️ THE PRESENCE PROOF IS ELEMENTS, NOT FOCUSABLES. A skeleton is a legitimate state with nothing to focus — asserting on focusables made the deliberately-slow state fail as if it were broken, which would have pushed the next session to delete the state rather than the assertion.
    if (!records.counts.elements) throw new Error(`state "${state.name}" examined 0 elements inside <main> — the page had not rendered, so a clean result would be meaningless`);
    return records;
}

// 🔴 A RED GATE ON A DIFF THAT CANNOT HAVE CAUSED IT IS WORSE THAN NO GATE. Added 2026-09-02 18:07 EDT after PR #181 -- 31 files of hooks, rules, docs and two doc-audit scripts, ZERO portal files and zero runtime .js -- failed `syntax-check` three consecutive times on `manifest . nothing matches the search`, while this same script passed locally on that same tree, 44 states walked, exit 0. `syntax-check` is a REQUIRED check, so a non-deterministic browser walk was able to block any pull request in the repository. That coupling is the defect being fixed here; the underlying non-determinism is filed separately in docs/db-deferred-list.md and is NOT claimed to be solved.
//
// ⚠️ IT FAILS CLOSED, AND THAT IS THE WHOLE SAFETY ARGUMENT. If the changed-file list cannot be determined -- no git, no reachable base, an empty diff -- the walk RUNS. A skip is only ever taken from a list that was actually read and actually contains nothing this script measures. The dangerous direction is skipping on uncertainty, because that turns a portal change into a silent pass, which is the exact vacuous-pass shape the rest of this file exists to prevent.
//
// ⚠️ AND IT SHOUTS. The skip prints as `⚠ SKIPPED` with the base it compared against and the file count, in the same shape as the no-Chrome branch below, because a skip that reads like a pass is how a gate quietly stops being one.
export const PORTAL_TOUCHED = [
    (f) => f.startsWith('portal/'),
    (f) => f.startsWith('scripts/portal'),
    (f) => f.startsWith('docs/superpowers/mockups/'),
    // A dependency bump can move puppeteer or Chrome under the walk without any portal file changing. ⚠️ But a VERSION BUMP is not a dependency change, and treating it as one made this filter useless on the first PR it met: every release touches package.json and package-lock.json, so the walk would have run on every diff regardless. `manifestChangedBeyondVersion` below reads the actual diff and keeps these two only when something other than the version field moved.
    (f) => f === 'package.json' || f === 'package-lock.json',
];

// Exported for the test. A package.json diff that only moves `"version"` cannot affect a browser walk, and counting it as if it could is how a narrowing filter quietly widens back to everything — every release touches that file.
//
// ⚠️ IT IS DELIBERATELY BROADER THAN ITS OLD NAME (`depsChanged`) CLAIMED, and the name was the half that was wrong — renamed 2026-09-02 18:23 EDT by a code review. ANY non-version change here re-arms the walk, a `scripts` edit included, because `scripts` decides what actually runs. That is conservative on purpose: this branch edits `scripts` and therefore correctly does NOT skip its own walk. Narrowing until my own PR went green would be the "tune the gate until it passes" failure this repo has receipts for.
export function manifestChangedBeyondVersion(diffText) {
    if (!diffText) return false;
    return diffText
        .split('\n')
        .filter((l) => (l.startsWith('+') || l.startsWith('-')) && !l.startsWith('+++') && !l.startsWith('---'))
        .some((l) => !/^[+-]\s*"version"\s*:/.test(l));
}
export function portalTouched(changed) {
    if (!Array.isArray(changed) || !changed.length) return true;   // unknown or empty => RUN
    return changed.some((f) => PORTAL_TOUCHED.some((m) => m(f)));
}

function changedAgainstBase() {
    const { execFileSync } = require('child_process');
    const bases = [];
    if (process.env.GITHUB_BASE_REF) bases.push(`origin/${process.env.GITHUB_BASE_REF}`);
    bases.push('origin/v3-pre-release', 'origin/main');
    for (const base of bases) {
        try {
            const out = execFileSync('git', ['diff', '--name-only', `${base}...HEAD`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
            let files = out.split('\n').map((x) => x.trim()).filter(Boolean);
            const manifests = files.filter((f) => f === 'package.json' || f === 'package-lock.json');
            if (manifests.length) {
                const d = execFileSync('git', ['diff', `${base}...HEAD`, '--', ...manifests], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
                if (!manifestChangedBeyondVersion(d)) files = files.filter((f) => !manifests.includes(f));
            }
            // 🔴 RETURN ON THE FIRST BASE THAT RESOLVED, not the first that survives filtering -- corrected 2026-09-02 18:23 EDT by a code review. When the version-only filter emptied `files`, the loop fell through and tried the NEXT base, so a PR branched from v3-pre-release could end up judged against origin/main. An empty post-filter list is a real answer ("nothing here concerns the walk"), not a failed lookup to retry elsewhere.
            return { base, files };
        } catch { /* this base is unreachable -- try the next */ }
    }
    return null;
}

async function run() {
    const args = process.argv.slice(2);
    const flag = (n) => args.includes(n);
    const only = args.includes('--realm') ? args[args.indexOf('--realm') + 1] : null;

    // Only in --ci. An interactive run is someone asking the question directly, and the answer to "walk the states" is never "I decided you did not mean it".
    if (flag('--ci')) {
        const diff = changedAgainstBase();
        if (diff && !portalTouched(diff.files)) {
            console.error(`  ⚠ SKIPPED — none of the ${diff.files.length} file(s) changed against ${diff.base} is one this walk measures (portal/, scripts/portal*, the mockups, or a dependency bump).`);
            console.error('    NOT a pass: no state was walked. Run it without --ci to walk them anyway.');
            console.error('    This exists because a browser walk that is red on a diff it cannot have caused blocks every PR in the repo -- see docs/db-deferred-list.md for the non-determinism itself, which this does NOT fix.');
            return;
        }
    }

    fs.mkdirSync(REGISTRY, { recursive: true });
    const files = fs.readdirSync(REGISTRY).filter((f) => f.endsWith('.json')).filter((f) => !only || f === `${only}.json`);
    if (!files.length) { console.log(`portal:states — no registries in portal/fixtures/states${only ? ` matching "${only}"` : ''}. Each realm registers its own states as it walks them.`); return; }

    const { findChrome, CHROME_CANDIDATES } = require('./lib/chromePath.cjs');
    const chrome = findChrome();
    if (!chrome) {
        console.error('  ⚠ SKIPPED — no Chrome found. Tried:\n      ' + CHROME_CANDIDATES.join('\n      '));
        console.error('    Set PUPPETEER_EXECUTABLE_PATH to run this check. NOT a pass.');
        process.exit(0);
    }

    require('./buildPortal.js').build();
    const { server, port } = await serve();
    const puppeteer = require('puppeteer-core');
    const browser = await puppeteer.launch({ executablePath: chrome, args: ['--no-sandbox'] });
    let bad = false, walked = 0; const flaked = [];
    try {
        const page = await browser.newPage();
    // 🔴 THE CLOCK IS FROZEN, for the reason portalGeometry's was on 2026-08-31: an instrument that
    //    measures a page which moves while it is being measured reports drift as a finding. The season
    //    countdown reads Date.now() now (the design's start-of-day source was refused as class (b)), so a
    //    live clock changes the WIDTH of its readout between two runs. Same instant portalDiff pins.
    await page.evaluateOnNewDocument((t) => {
        const RealDate = Date;
        const Frozen = function (...a) { return a.length ? new RealDate(...a) : new RealDate(t); };
        Frozen.prototype = RealDate.prototype;
        Frozen.now = () => t; Frozen.parse = RealDate.parse; Frozen.UTC = RealDate.UTC;
        window.Date = Frozen;
        try { performance.now = () => 0; } catch { /* read-only in some builds */ }
    }, Date.parse('2026-08-24T18:41:00Z'));
        await page.setViewport({ width: VIEWPORT.w, height: VIEWPORT.h });
        for (const f of files) {
            const file = path.join(REGISTRY, f);
            const registry = JSON.parse(fs.readFileSync(file, 'utf8'));
            console.log(`\n${registry.surface} — ${registry.states.length} state(s)`);
            for (const state of registry.states) {
                // 🔴 A STALL IS RETRIED ONCE AND CLASSIFIED, BECAUSE A BIGGER DEADLINE HAS ALREADY BEEN TRIED THREE TIMES AND IS NOT THE ANSWER. This file's own history raised the subject wait 4000 → 12000 → 45000, and on 2026-09-01 20:14 EDT it still failed four times across four runs on FOUR DIFFERENT states -- `identity · closed again`, `composer · the paste box`, `manifest selection bar`, and one in CI. Forty-five seconds of absence is not impatience; it is a step that clicked before its target mounted, so the subject never arrives at all and no deadline reaches it. 🔴 AND THE COST IS NOT A WASTED RE-RUN. `npm test` is one `&&` chain, so a stall here TRUNCATES every gate after it: on this very branch it hid a real defect -- `/api/access` promising a `sessionTtlHours` key the harness stub did not serve -- which only CI found, on a run where the stall happened not to fire. A suite that stops at a race reports the race's name instead of the defect's. ⚠️ RETRY-THEN-CLASSIFY, NEVER RETRY-UNTIL-GREEN. A second attempt distinguishes a race (passes) from a genuinely unreachable subject (fails twice, and still fails the suite with the same sentence). A FLAKED state is printed by name so it can never be silent, and the run's exit code is unchanged by it -- which is the whole point: the states AFTER it now get to run.
                let records;
                try {
                    records = await walk(page, state, port);
                } catch (e) {
                    if (!isStall(e.message)) throw e;
                    try {
                        records = await walk(page, state, port);
                        flaked.push(state.name);
                        console.log(`  ⚠ FLAKED ${state.name.padEnd(30)} stalled once, reached its subject on the retry — not a defect, and not silent`);
                    } catch (again) {
                        throw new Error(`${again.message}\n           ⚠️ TWICE, so this is NOT the known race — the subject is genuinely unreachable.`);
                    }
                }
                const findings = runPasses(records);
                const { fresh, fixed } = diffAgainstKnown(findings, state.known || []);
                walked++;
                const tally = `${records.counts.controls} control(s), ${records.counts.focusables} focusable`;
                if (!findings.length) console.log(`  ✓ ${state.name.padEnd(34)} ${tally}`);
                else console.log(`  · ${state.name.padEnd(34)} ${tally} — ${findings.length} finding(s), ${fresh.length} new`);
                for (const x of fresh) console.log(`      ❌ PASS ${x.pass}  ${x.id}\n           ${x.detail}`);
                for (const k of fixed) console.log(`      ✅ fixed since the last recording: ${k}`);
                if (flag('--record')) state.known = findings.map(keyOf);
                if (flag('--ci') && (fresh.length || fixed.length)) bad = true;
            }
            if (flag('--record')) { fs.writeFileSync(file, JSON.stringify(registry, null, 2) + '\n'); console.log(`  ✅ recorded → portal/fixtures/states/${f}`); }
        }
    } finally {
        await browser.close();
        server.close();
    }
    console.log(`\n${walked} state(s) walked at ${VIEWPORT.w}x${VIEWPORT.h}.`);
    // A FLAKED run is not a clean run, and the summary says so rather than letting the exit code speak alone. It does not fail the suite -- the states after it are exactly what a hard failure was costing -- but a reader who sees this line knows the tree was measured through a retry.
    if (flaked.length) console.log(`⚠️  ${flaked.length} state(s) stalled once and passed on retry: ${flaked.join(' · ')} — the known race, filed [P2 · M]. NOT a clean run.`);
    if (bad) { console.log('❌ a finding is new, or a recorded one is fixed and still listed. Fix it, or re-record with --record in the same commit.'); process.exit(1); }
}

// ⚠️ GUARDED BECAUSE THIS MODULE IS NOW IMPORTED. `isStall` is exported for the self-test, and a bare `run()` at module scope meant importing the predicate booted a forty-state puppeteer walk as a side effect — the test passed, slowly, for the wrong reason. Only a direct invocation runs.
if (process.argv[1] && process.argv[1].endsWith('portalStates.mjs')) {
    run().catch((e) => { console.error('portal:states failed —', e.message); process.exit(1); });
}
