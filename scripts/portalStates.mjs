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
const { walkJobs } = require('./lib/walkJobs.cjs');
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

// 🔴 EXPORTED AND NARROW ON PURPOSE. The retry below re-runs a state whose subject never appeared, and the ONE thing that must not happen is retrying a genuine crash -- a TypeError inside a pass would be run twice, could pass the second time, and would then be reported as a race. So the predicate matches only the two sentences this file itself throws for an unreached subject, and its test proves it is silent on everything else. Exported so the retry's ONE promise is testable without a browser: at patience 1 it must be exactly zero, so the first attempt of every state is byte-for-byte the run it has always been and a green suite keeps its old meaning. Added 2026-09-09 17:28 EDT.
export function stepPause(patience) {
    return Math.max(0, (Number(patience) || 1) - 1) * 250;
}

export function isStall(message) {
    return /did not reach its own subject|stalled: nothing matched/.test(String(message || ''));
}

// 🔴 WAIT FOR THE TARGET, THEN ACT — added 2026-09-14 18:30 EDT. Every step used to run `querySelector(s); if (el) el.click()`, so a step that fired before its target had rendered clicked NOTHING and said nothing; the walk then waited up to 45 s for a subject that could never appear and reported a stall. That is the signature of every CI failure of this walk (six, counted 2026-09-14) and it is why the 4000 → 12000 → 45000 deadline raises never fixed it: the missing wait was the one IN FRONT of the step. The thrown message keeps the `stalled: nothing matched` wording, so isStall still classifies it and the patience retry still gets its one attempt — but a target that never appears is now named, not skipped.
export const TARGET_MS = 10000;
const VACUOUS = [];
async function waitForTarget(page, state, selector, patience = 1) {
    try {
        await page.waitForSelector(selector, { timeout: TARGET_MS * patience });
    } catch {
        throw new Error(`state "${state.name}" stalled: nothing matched ${selector} to act on within ${TARGET_MS * patience}ms, so its step would have acted on nothing`);
    }
}
async function waitForTargetText(page, state, target, patience = 1) {
    try {
        await page.waitForFunction((t) => [...document.querySelectorAll(t.sel)].some((x) => (x.textContent || '').includes(t.text)), { timeout: TARGET_MS * patience }, target);
    } catch {
        throw new Error(`state "${state.name}" stalled: nothing matched ${target.sel} containing "${target.text}" to act on within ${TARGET_MS * patience}ms, so its step would have acted on nothing`);
    }
}

// 🔴 `patience` IS WHAT MAKES THE RETRY A DIFFERENT EXPERIMENT RATHER THAN THE SAME ONE TWICE — added 2026-09-09 17:28 EDT, closing the filed [P2 · M] entry's own first option. The retry below used to re-run `walk` with identical arguments, and the filed measurement is that the stall fires roughly half the time, so two consecutive failures happen about a quarter of the time by chance: repeating an experiment cannot separate the two cases it claims to separate. ⚠️ AND THE VARIED THING IS DELIBERATELY **NOT THE DEADLINE**. This file's history raised the subject wait 4000 → 12000 → 45000 and it still failed; the entry rules a fourth raise out explicitly. The diagnosis written fourteen lines below is that a step CLICKS BEFORE ITS TARGET MOUNTS, so the wait that was missing is the one BEFORE the step, not after it. `patience` buys exactly that, and leaves every deadline where it is.
async function walk(page, state, port, patience = 1) {
    // ⚠️ SET BEFORE THE NAVIGATION, and cleared for every state that did not ask — an emulated media feature is sticky on the page, so one reduced-motion state would silently put every state after it into reduced motion and their clean results would mean something else entirely.
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: state.reduceMotion ? 'reduce' : 'no-preference' }]);
    const q = new URLSearchParams(state.flags || {});
    q.set('b', String(Date.now()));
    await page.goto(`http://127.0.0.1:${port}/harness.html?${q}#/${state.realm || 'home'}`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);                                     // never rAF: it does not fire off-screen, and a pass gated on it reports pending forever
    await page.waitForSelector('main', { timeout: 15000 });
    // ⚠️ `slow` DELAYS THE FIRST LOAD TOO, so a state that injects it and then clicks something immediately clicks into a skeleton. `preSettleMs` waits for the data to arrive BEFORE the steps run — which is the whole point of the refreshing state: it only exists when there is already data on screen to keep.
    if (state.preSettleMs) await page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), state.preSettleMs * patience);
    // 🔴 A SUBJECT ALREADY ON THE PAGE PROVES NOTHING ABOUT THE STEPS — added 2026-09-14, refined 2026-09-14 19:11 EDT. The analytics tile state clicked a label that no longer existed and still passed for eleven days, because its expect (any selected view tab) was true before any step ran. Waiting for a step's target catches a MISSING target; this reports the other half, a subject that cannot tell whether the steps did anything. It waits for the first step's target before looking, because the first version looked immediately and reported a state in one run and not the next as the page raced it; and a state with an `until` on any step is exempt, because the `until` already proves a transition happened. Report-only: VACUOUS is printed at the end of the walk.
    if (patience === 1 && state.expect && (state.steps || []).length && !state.steps.some((s) => s.until)) {
        const first = state.steps[0];
        if (first.click || first.hover) await waitForTarget(page, state, first.click || first.hover, patience);
        else if (first.clickText) await waitForTargetText(page, state, first.clickText, patience);
        else if (first.type) await waitForTarget(page, state, (typeof first.type === 'object' ? first.type : first).sel, patience);
        if (await page.$(state.expect)) VACUOUS.push(state.name);
    }
    for (const step of state.steps || []) {
        // The pre-step wait, and it exists only on a retry: at patience 1 this is zero and the first attempt is byte-for-byte the run it always was, so a green suite keeps meaning what it meant.
        const pause = stepPause(patience);
        if (pause) await page.evaluate((ms) => new Promise((r) => setTimeout(r, ms)), pause);
        if (step.key) await page.evaluate((k) => document.dispatchEvent(new KeyboardEvent('keydown', { key: k.key, metaKey: !!k.meta, bubbles: true })), step);
        if (step.click) await waitForTarget(page, state, step.click, patience);
        if (step.click) await page.evaluate((s) => { const el = document.querySelector(s); if (el) el.click(); }, step.click);
        // ⚠️ A MENU ITEM IS IDENTIFIED BY ITS WORDS, NOT ITS POSITION. `.who [role=menuitem]` matched the FIRST item — "What you can do", which navigates away — so the state named "toast after an account action" walked to a different realm and reported clean. A registry that addresses controls positionally breaks every time a menu gains an entry, silently.
        if (step.clickText) await waitForTargetText(page, state, step.clickText, patience);
        if (step.clickText) await page.evaluate((s) => { const el = [...document.querySelectorAll(s.sel)].find((x) => (x.textContent || '').includes(s.text)); if (el) el.click(); }, step.clickText);
        // ⚠️ A TOOLTIP IS CONTENT AND IS INVISIBLE TO A SCREENSHOT, so the runtime that renders it has to be walked like any other state. tips.js delegates from the document, so a synthetic pointerover on the host is what a real pointer would produce.
        if (step.hover) await waitForTarget(page, state, step.hover, patience);
        // 🔴 A REAL POINTER, NOT SYNTHETIC EVENTS — changed 2026-09-14 19:31 EDT. This dispatched pointerover and mouseover on the element, which never produces a pointermove, and the Track's crosshair follows pointermove: the one state that hovers never showed its crosshair, and passed anyway because its expect named the hover target itself. page.hover moves the real mouse, so every pointer event a person would cause fires.
        if (step.hover) await page.hover(step.hover);
        // ⚠️ `type` ACCEPTS BOTH SHAPES, and it did not until 2026-08-28. Every other step that needs two values nests them (`clickText: {sel, text}`), so a registry written by hand naturally writes `type: {sel, text}` — which this read as `step.sel`/`step.text`, found undefined, and typed nothing into nothing. The step then "ran", and only `expect` reported that the state had not been reached. Cost a real debugging loop; a driver that accepts the shape its own siblings teach costs nothing.
        if (step.type) {
            const t = (typeof step.type === 'object') ? step.type : step;
            await waitForTarget(page, state, t.sel, patience);
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
    // The mouse is per page, and a worker walks many states on one page: park it off the page after a hover so the next state does not start with something hovered.
    if ((state.steps || []).some((s) => s.hover)) await page.mouse.move(-10, -10);
    return records;
}

async function run() {
    const args = process.argv.slice(2);
    const flag = (n) => args.includes(n);
    const only = args.includes('--realm') ? args[args.indexOf('--realm') + 1] : null;

    // 🚫 The --ci diff skip that stood here (2026-09-02 → 2026-09-14 18:30 EDT) is RETIRED. It existed because this walk raced, and a red run on a diff that could not have caused it blocked every PR. The race is fixed at its root (waitForTarget, above), and on 2026-09-14 Harkirat decided that CI runs everything: skipping unchanged work belongs to the local runner's cache, never to CI.
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
    // 🔴 WORKERS, EACH IN ITS OWN BROWSER CONTEXT — added 2026-09-14 18:30 EDT. Every state navigates fresh, so the states are independent and spread across walkJobs(PORTAL_STATES_JOBS) pages. A separate context per worker, never one shared context: pages in one context share localStorage and sessionStorage, and a state that clears storage on load would wipe a neighbour mid-walk. Output is buffered per state and printed in registry order, so a parallel run reads exactly like the serial one, and --record still writes each registry once, after all of its states.
    const regs = files.map((f) => { const file = path.join(REGISTRY, f); return { f, file, registry: JSON.parse(fs.readFileSync(file, 'utf8')), out: [] }; });
    const queue = regs.flatMap((reg) => reg.registry.states.map((state, i) => ({ reg, state, i })));
    const jobs = Math.max(1, Math.min(walkJobs(process.env.PORTAL_STATES_JOBS), queue.length));
    let failure = null;
    try {
        const worker = async () => {
            const context = await browser.createBrowserContext();
            const page = await context.newPage();
            // 🔴 EVERY STATE STARTS FROM EMPTY STORAGE — added 2026-09-14 19:07 EDT. States used to share one page for the whole walk, so sessionStorage written by one state was read by the next: Season's identity panel remembers open/closed in sessionStorage, and "closed again from the header's dead space" passed only because the state before it happened to leave the panel closed. Spread across workers, it failed 3 runs of 3 (the worker's previous state had left it open) while Season alone, serial or parallel, passed. A state is now self-contained, which is what its registry entry always claimed.
            await page.evaluateOnNewDocument(() => { try { sessionStorage.clear(); localStorage.clear(); } catch { /* a sandboxed context can refuse */ } });
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
            while (queue.length && !failure) {
                const { reg, state, i } = queue.shift();
                const out = (reg.out[i] = []);
                // 🔴 A STALL IS RETRIED ONCE AND CLASSIFIED, BECAUSE A BIGGER DEADLINE HAS ALREADY BEEN TRIED THREE TIMES AND IS NOT THE ANSWER. This file's own history raised the subject wait 4000 → 12000 → 45000, and on 2026-09-01 20:14 EDT it still failed four times across four runs on FOUR DIFFERENT states -- `identity · closed again`, `composer · the paste box`, `manifest selection bar`, and one in CI. Forty-five seconds of absence is not impatience; it is a step that clicked before its target mounted, so the subject never arrives at all and no deadline reaches it. 🔴 AND THE COST IS NOT A WASTED RE-RUN. `npm test` is one `&&` chain, so a stall here TRUNCATES every gate after it: on this very branch it hid a real defect -- `/api/access` promising a `sessionTtlHours` key the harness stub did not serve -- which only CI found, on a run where the stall happened not to fire. A suite that stops at a race reports the race's name instead of the defect's. ⚠️ RETRY-THEN-CLASSIFY, NEVER RETRY-UNTIL-GREEN. A second attempt distinguishes a race (passes) from a genuinely unreachable subject (fails twice, and still fails the suite with the same sentence). A FLAKED state is printed by name so it can never be silent, and the run's exit code is unchanged by it -- which is the whole point: the states AFTER it now get to run.
                let records;
                try {
                    records = await walk(page, state, port);
                } catch (e) {
                    if (!isStall(e.message)) throw e;
                    try {
                        records = await walk(page, state, port, 3);
                        flaked.push(state.name);
                        out.push(`  ⚠ FLAKED ${state.name.padEnd(30)} stalled at patience 1, reached its subject at patience 3 — a slower run gets there, which is the race, not a defect`);
                    } catch (again) {
                        // 🔴 THE SENTENCE THIS THROW USED TO CARRY WAS AN INVALID INFERENCE, corrected 2026-09-05 09:34 EDT. It asserted that two failures prove the stall is not the filed race. The filed entry measures that stall at roughly 50% in-suite, so two consecutive failures happen about a quarter of the time by chance alone: the retry cannot separate the two cases it claimed to separate. ⚠️ THE DISPROOF WAS ALREADY WRITTEN FOURTEEN LINES ABOVE AND THE CLAIM WAS MADE ANYWAY — four failures across four runs on FOUR DIFFERENT states is the signature of a race, not of one broken subject. ⚠️ IT COST A REAL INVESTIGATION ON 2026-09-05: CI failed here while the same tree passed 44/44 locally, and this sentence asserted the one thing that would have made that a defect. Re-running settled it in one command — the failing state MOVED, which is the only observation that discriminates, and it is named in the message now so the next reader has it at the point of failure rather than in a tracker they would have to already suspect.
                        throw new Error(`${again.message}\n           ⚠️ The retry ran at PATIENCE 3 — a 500ms wait before every step and a tripled pre-settle — and still did not reach the subject. That is a stronger signal than the identical re-run this used to do, but it is still not proof: the filed stall is ~50% in-suite, so two failures happen about a quarter of the time by chance (docs/db-deferred-list.md, [P2 · M]).\n           ⚠️ WHAT DISCRIMINATES: does this state's selector belong to anything you edited? If not, re-run — and if the failing STATE changes between runs on the same tree, it is the race.`);
                    }
                }
                const findings = runPasses(records);
                const { fresh, fixed } = diffAgainstKnown(findings, state.known || []);
                walked++;
                const tally = `${records.counts.controls} control(s), ${records.counts.focusables} focusable`;
                if (!findings.length) out.push(`  ✓ ${state.name.padEnd(34)} ${tally}`);
                else out.push(`  · ${state.name.padEnd(34)} ${tally} — ${findings.length} finding(s), ${fresh.length} new`);
                for (const x of fresh) out.push(`      ❌ PASS ${x.pass}  ${x.id}\n           ${x.detail}`);
                for (const k of fixed) out.push(`      ✅ fixed since the last recording: ${k}`);
                if (flag('--record')) state.known = findings.map(keyOf);
                if (flag('--ci') && (fresh.length || fixed.length)) bad = true;
            }
        };
        await Promise.all(Array.from({ length: jobs }, () => worker().catch((e) => { if (!failure) failure = e; })));
    } finally {
        for (const reg of regs) {
            console.log(`\n${reg.registry.surface} — ${reg.registry.states.length} state(s)`);
            for (const lines of reg.out) for (const line of lines || []) console.log(line);
            if (!failure && flag('--record')) { fs.writeFileSync(reg.file, JSON.stringify(reg.registry, null, 2) + '\n'); console.log(`  ✅ recorded → portal/fixtures/states/${reg.f}`); }
        }
        await browser.close();
        server.close();
    }
    if (failure) throw failure;
    if (jobs > 1) console.log(`\n(${jobs} workers, PORTAL_STATES_JOBS to change it)`);
    console.log(`\n${walked} state(s) walked at ${VIEWPORT.w}x${VIEWPORT.h}.`);
    // A FLAKED run is not a clean run, and the summary says so rather than letting the exit code speak alone. It does not fail the suite -- the states after it are exactly what a hard failure was costing -- but a reader who sees this line knows the tree was measured through a retry.
    if (VACUOUS.length) console.log(`⚠️  ${VACUOUS.length} state(s) whose expect matched BEFORE their steps ran, so a step that did nothing would still pass: ${VACUOUS.join(' · ')}`);
    if (flaked.length) console.log(`⚠️  ${flaked.length} state(s) stalled once and passed on retry: ${flaked.join(' · ')} — the known race, filed [P2 · M]. NOT a clean run.`);
    if (bad) { console.log('❌ a finding is new, or a recorded one is fixed and still listed. Fix it, or re-record with --record in the same commit.'); process.exit(1); }
}

// ⚠️ GUARDED BECAUSE THIS MODULE IS NOW IMPORTED. `isStall` is exported for the self-test, and a bare `run()` at module scope meant importing the predicate booted a forty-state puppeteer walk as a side effect — the test passed, slowly, for the wrong reason. Only a direct invocation runs.
if (process.argv[1] && process.argv[1].endsWith('portalStates.mjs')) {
    run().catch((e) => { console.error('portal:states failed —', e.message); process.exit(1); });
}
