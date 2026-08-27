// scripts/portalHarnessRender.test.js — every realm, EXECUTED against the harness fixture.
//
// 🔴 THIS IS THE GATE THAT WOULD HAVE CAUGHT THE ARMORY OUTAGE. `ArmoryRealm` threw
// `ReferenceError: data is not defined` on every single load for a day — a bare `data` where
// every other line already read `load.data` — and `npm test`, `portal:coverage`, `portal:orphans`
// and `portal:refs` were all green throughout, because every one of them reads source TEXT. A
// class that is present is not a class that renders, and a branch that exists is not a branch
// that runs. The same blind spot shipped a double-CP window reading `data.calendar`, a key that
// does not exist on that prop, which rendered nothing forever.
//
// ⚠️ THIS IS NOT scripts/portalHarness.test.js, WHICH ALREADY EXISTS AND IS ALREADY IN `npm test`.
// That one executes the harness STUB and checks the payload SHAPE — that each stubbed route
// returns the keys the real route promises. It renders no component. A reader who greps for
// "portalHarness" and stops at the first hit will conclude this work is done; it is not, and the
// two files are complementary rather than redundant.
//
// 🔴 IT RUNS EFFECTS, WHICH IS THE WHOLE POINT AND IS WHY IT CANNOT USE preact-render-to-string.
// Every realm loads through `useAsync`, and `useAsync` fetches inside a `useEffect`. SSR does not
// run effects, so an SSR render of any realm reaches the LOADING skeleton and stops — the loaded
// branch, which is where all three of the bugs above lived, is never evaluated. So this mounts
// into a real (linkedom) document with preact's own `render()`, lets the effect fire, lets the
// harness stub resolve, and asserts on what is actually on the page afterwards.
//
// ⚠️ THE SEAM IS THE SAME ONE THE BROWSER USES. The harness page aliases /ui/httpClient.js to
// /harness/stub.js through an import map; here the scratch tree simply has the stub AT that
// filename. No production file is modified and no flag is threaded through a component, which is
// the property that makes the harness trustworthy in the first place.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'portal', 'public', '.hrender');

// The scratch tree exists for one reason: portal/ui/*.js import '../vendor/preact.mjs', which in
// the browser is a COPY of preact. Loading that copy in Node gives two preact instances with two
// `options` objects, and every hook throws `Cannot read properties of undefined (reading '__H')`.
// Re-exporting the real package makes component and renderer share one instance. It lives under
// portal/public (already gitignored) rather than /tmp because bare-specifier resolution walks up
// from the importing FILE, and outside the repo there is no node_modules to find.
function buildTree() {
    const uiSrc = path.join(ROOT, 'portal', 'ui');
    fs.rmSync(DIR, { recursive: true, force: true });
    fs.mkdirSync(path.join(DIR, 'ui'), { recursive: true });
    fs.mkdirSync(path.join(DIR, 'vendor'), { recursive: true });
    for (const f of fs.readdirSync(uiSrc).filter((n) => n.endsWith('.js'))) {
        fs.copyFileSync(path.join(uiSrc, f), path.join(DIR, 'ui', f));
    }
    // The alias. Same file the import map points at, put where the components already look.
    fs.copyFileSync(path.join(ROOT, 'portal', 'public', 'harness', 'stub.js'),
                    path.join(DIR, 'ui', 'httpClient.js'));
    fs.writeFileSync(path.join(DIR, 'vendor', 'preact.mjs'), "export * from 'preact';\n");
    fs.writeFileSync(path.join(DIR, 'vendor', 'preact-hooks.mjs'), "export * from 'preact/hooks';\n");
    fs.writeFileSync(path.join(DIR, 'vendor', 'htm-preact.mjs'),
        "import { h } from 'preact';\nimport htm from 'htm';\nexport const html = htm.bind(h);\n");
}

// The *.logic.js siblings ship as classic <script> tags rather than modules (see track.js's header
// for why), so the components read them as bare globals. Globbed from the same directory
// buildPortal globs — a hardcoded list here fell behind the build once already.
function installLogicGlobals() {
    const dir = path.join(ROOT, 'portal', 'ui');
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.logic.js'))) {
        const mod = require(path.join(dir, f));
        Object.assign(globalThis, mod);
        // A namespace export (`module.exports = TL`) installs its MEMBERS above and never its own
        // name, and every component reading a bare `TL` — the entire Track — then throws. The name
        // is read out of the file's own browser line rather than hardcoded.
        for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)) {
            if (!(m[1] in globalThis)) globalThis[m[1]] = mod;
        }
    }
}

let failures = 0;
function check(name, fn) {
    return Promise.resolve()
        .then(fn)
        .then(() => console.log(`  ✓ ${name}`))
        .catch((e) => { failures++; console.error(`  ✗ ${name}\n      ${e && e.stack || e}`); });
}

(async () => {
    buildTree();

    const { parseHTML } = require('linkedom');
    const dom = parseHTML('<!doctype html><html><body><main><div id="app"></div></main></body></html>');

    // linkedom gives the document; the globals below are what preact and the components reach for.
    for (const k of ['document', 'Node', 'Text', 'Element', 'HTMLElement', 'Event', 'CustomEvent',
                     'SVGElement', 'MutationObserver', 'getComputedStyle', 'DocumentFragment']) {
        if (dom[k] !== undefined) globalThis[k] = dom[k];
    }
    globalThis.window = dom.window || dom;
    globalThis.navigator = globalThis.window.navigator || { userAgent: 'node' };
    globalThis.location = globalThis.window.location
        || { search: '', hash: '#/season', href: 'http://localhost/harness.html' };
    globalThis.window.location = globalThis.location;
    globalThis.requestAnimationFrame = (fn) => setTimeout(fn, 0);
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
    globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    globalThis.window.matchMedia = globalThis.matchMedia;
    globalThis.window.addEventListener = globalThis.window.addEventListener || (() => {});
    globalThis.window.removeEventListener = globalThis.window.removeEventListener || (() => {});
    globalThis.window.scrollTo = () => {};
    globalThis.window.getSelection = () => ({ toString: () => '' });
    // The realms persist view state; a Map-backed shim keeps that path real rather than absent.
    const store = new Map();
    globalThis.localStorage = globalThis.window.localStorage = {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
    };
    globalThis.window.FIX = undefined;

    // fixtures.js is a classic script that assigns window.FIX. Run it as one, against the same
    // window the components will see, rather than reimplementing the fixture here — a second copy
    // of the fixture is a second thing that can disagree with the browser.
    const fixturesSrc = fs.readFileSync(path.join(ROOT, 'portal', 'public', 'harness', 'fixtures.js'), 'utf8');
    vm.runInThisContext(fixturesSrc, { filename: 'harness/fixtures.js' });
    assert.ok(globalThis.window.FIX, 'fixtures.js populated window.FIX');

    installLogicGlobals();

    const { render } = await import('preact');
    const { html } = await import('../portal/public/.hrender/vendor/htm-preact.mjs');

    const REALMS = {
        season: ['../portal/public/.hrender/ui/season.js', 'SeasonRealm'],
        armory: ['../portal/public/.hrender/ui/armory.js', 'ArmoryRealm'],
        broadcast: ['../portal/public/.hrender/ui/broadcast.js', 'BroadcastRealm'],
        access: ['../portal/public/.hrender/ui/access.js', 'AccessRealm'],
        analytics: ['../portal/public/.hrender/ui/analytics.js', 'AnalyticsRealm'],
        review: ['../portal/public/.hrender/ui/review.js', 'ReviewRealm'],
        home: ['../portal/public/.hrender/ui/home.js', 'HomeRealm'],
    };

    // What /auth/csrf returns, which is every realm's `session` prop. Read from the stub's own
    // route rather than retyped, so a change to the session shape reaches this gate for free.
    const { fetchJson } = await import('../portal/public/.hrender/ui/httpClient.js');
    const session = await fetchJson('/auth/csrf');

    // 🔴 THE ERROR TRAP IS THE ASSERTION. A component that throws during render does not
    // necessarily reject a promise here — preact reports it through options._catchError and
    // through the host's uncaught handlers — so every route an exception can take is collected and
    // the check reads the collection. Without this a throwing realm renders an empty tree, and an
    // empty tree is indistinguishable from a realm that simply has nothing to show.
    const caught = [];
    const onErr = (e) => caught.push(e && (e.reason || e.error || e));
    process.on('uncaughtException', onErr);
    process.on('unhandledRejection', onErr);
    const origError = console.error;

    async function mount(realm) {
        caught.length = 0;
        const [mod, name] = REALMS[realm];
        const M = await import(mod);
        const Component = M[name];
        assert.ok(typeof Component === 'function', `${name} is exported from ${mod}`);
        const host = dom.document.getElementById('app');
        host.innerHTML = '';
        // console.error is preact's own last resort for a render error; capturing it turns a
        // logged-and-swallowed failure into a recorded one.
        const logged = [];
        console.error = (...a) => logged.push(a.map(String).join(' '));
        try {
            render(html`<${Component} session=${session} />`, host);
            // Two ticks: the effect fires, the stub's promises settle, the loaded branch renders.
            for (let i = 0; i < 8; i++) await new Promise((r) => setTimeout(r, 0));
        } finally {
            console.error = origError;
        }
        return { host, logged };
    }

    for (const realm of Object.keys(REALMS)) {
        await check(`${realm} mounts, runs its effects, and renders past the skeleton`, async () => {
            const { host, logged } = await mount(realm);
            assert.deepStrictEqual(caught, [], `${realm} threw during render or effect`);
            const errish = logged.filter((l) => /error|not defined|undefined is not|cannot read/i.test(l));
            assert.deepStrictEqual(errish, [], `${realm} logged a render error`);
            const out = host.innerHTML;
            assert.ok(out && out.length > 400, `${realm} rendered a tree (got ${out.length} chars)`);
            // 🔴 THE SKELETON IS NOT A PASS. A realm whose loader failed still renders the shell and
            // a skeleton, which is a perfectly valid non-empty tree — and is exactly what the dead
            // Armory looked like for a day. The realm has to have got PAST it.
            assert.ok(!/class="[^"]*\bskel\b/.test(out) || /class="[^"]*\bmasthead\b/.test(out),
                `${realm} is still showing only its loading skeleton`);
            assert.ok(/class="[^"]*\bmasthead\b/.test(out), `${realm} rendered its masthead`);
        });
    }

    process.off('uncaughtException', onErr);
    process.off('unhandledRejection', onErr);

    console.log(failures ? `\n${failures} failed` : '\nevery realm executed against the fixture, past its skeleton');
    process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('  ✗ harness failed to start\n      ' + (e && e.stack || e)); process.exit(1); });
