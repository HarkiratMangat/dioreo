// scripts/portalRender.test.js — the portal's RENDER path, server-rendered.
//
// scripts/portalUi.test.js covers the pure functions the components call. This covers the components themselves: given fixture props, does the tree still contain what the design requires? Preact components here are pure (state in, tree out — spec §12a), so `preact-render-to-string` renders them in Node with no DOM and no browser.
//
// 🔴 THIS IS A STRUCTURAL CHECK, NOT A GOLDEN SNAPSHOT, and that is deliberate. Phase 4's job is to verify the portal LOOKS and BEHAVES right, by hand, against the mockups. A golden blob written by the session that built the thing would make that verification circular — Session C would be checking output against a fixture authored by the same pass. Asserting that a component still emits the elements its design depends on is complementary: it catches a component silently losing a piece, and says nothing about whether the piece is well designed.
//
// ⚠️ RENDERS THE REAL COMPONENT FILES AGAINST A RE-POINTED VENDOR DIRECTORY. portal/ui/*.js import '../vendor/preact.mjs' — the browser gets a COPY of preact there, and preact-render-to-string resolves the one in node_modules. Two instances of preact means two `options` objects, and every hook throws `Cannot read properties of undefined (reading '__H')` because the renderer's dispatcher was never installed on the copy the component is using. Found by running this, not by reasoning about it: the four hook-free components passed and every hook-using one failed identically.
//
// The fix is a scratch tree whose vendor/ RE-EXPORTS the real packages instead of copying them, so component and renderer share one preact. It lives under portal/public/ (already gitignored) rather than /tmp, because bare-specifier resolution walks up from the importing FILE — outside the repo there is no node_modules to find.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { build } = require('./buildPortal');

const SSR_DIR = path.join(__dirname, '..', 'portal', 'public', '.ssr');
function buildSsrTree() {
    const uiSrc = path.join(__dirname, '..', 'portal', 'ui');
    fs.rmSync(SSR_DIR, { recursive: true, force: true });
    fs.mkdirSync(path.join(SSR_DIR, 'ui'), { recursive: true });
    fs.mkdirSync(path.join(SSR_DIR, 'vendor'), { recursive: true });
    for (const f of fs.readdirSync(uiSrc).filter((f) => f.endsWith('.js'))) {
        fs.copyFileSync(path.join(uiSrc, f), path.join(SSR_DIR, 'ui', f));
    }
    fs.writeFileSync(path.join(SSR_DIR, 'vendor', 'preact.mjs'), "export * from 'preact';\n");
    fs.writeFileSync(path.join(SSR_DIR, 'vendor', 'preact-hooks.mjs'), "export * from 'preact/hooks';\n");
    fs.writeFileSync(path.join(SSR_DIR, 'vendor', 'htm-preact.mjs'),
        "import { h } from 'preact';\nimport htm from 'htm';\nexport const html = htm.bind(h);\n");
}

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

// The realm components read their pure helpers as BARE GLOBALS, because those siblings ship as classic <script> tags rather than modules (see portal/ui/track.js's header for why). A browser gets them from the script tags; Node gets them from here. Same files, same functions.
function installLogicGlobals() {
    for (const mod of ['board', 'season', 'track', 'manifest', 'armory', 'broadcast', 'v2Render']) {
        Object.assign(globalThis, require(`../portal/ui/${mod}.logic`));
    }
}

const SEASON_ROWS = [
    { id: 'd1', title: 'Iron Wolf — Legendary', lane: 'newDraws', typeLabel: 'New draw', topicVar: '--draw', state: 'live', window: '→ Aug 10 2026' },
    { id: 'd2', title: 'Havoc rerun', lane: 'returningDraws', typeLabel: 'Returning draw', topicVar: '--ret', state: 'staged', window: '→ Aug 27 2026' },
    { id: 'e1', title: 'Hardpoint 24/7', lane: 'calendar', typeLabel: 'Playlist', topicVar: '--play', state: 'conflict', window: '→ Sep 1 2026' },
];
const SEASON_COLUMNS = [
    { key: 'title', label: 'Item' },
    { key: 'lane', label: 'Type', render: (r) => r.typeLabel },
    { key: 'window', label: 'Window', dataKind: 'date' },
    { key: 'state', label: 'State' },
];

(async () => {
    build();                       // proves the real build still runs; the SSR tree is built from the same sources
    buildSsrTree();
    installLogicGlobals();
    const { render } = await import('preact-render-to-string');
    const { html } = await import('../portal/public/.ssr/vendor/htm-preact.mjs');
    const { Shell, Masthead, Rail, Door } = await import('../portal/public/.ssr/ui/shell.js');
    const { Manifest } = await import('../portal/public/.ssr/ui/manifest.js');
    const { Board } = await import('../portal/public/.ssr/ui/board.js');

    const session = { discordId: '1139845545754632283', isOwner: true, csrfToken: 'x', visibleRealms: ['season', 'armory', 'broadcast', 'access', 'analytics'] };

    check('the nav is a RAIL with one entry per visible realm, and marks the current one', () => {
        const out = render(html`<${Rail} realm="season" realms=${session.visibleRealms} badges=${{ season: 2 }} />`);
        assert.ok(out.includes('class="rail"'), 'the rail element itself');
        for (const r of session.visibleRealms) assert.ok(out.includes(`href="#/${r}"`), `a link to ${r}`);
        assert.ok(/class="rl active"[^>]*aria-current="page"/.test(out) || out.includes('aria-current="page"'), 'the current realm is announced, not only coloured');
        assert.ok(out.includes('<svg'), 'each entry carries its icon — a bare text rail is the old top bar again');
        assert.ok(out.includes('>2<'), 'the staged badge renders its count');
    });

    check('the rail hides a realm the signed-in admin cannot see', () => {
        const out = render(html`<${Rail} realm="season" realms=${['season', 'broadcast']} />`);
        assert.ok(out.includes('href="#/broadcast"'));
        assert.ok(!out.includes('href="#/access"'), 'a realm outside visibleRealms must not appear');
    });

    // 🔴 REVIEW IS BELOW THE RULE, NOT A SIXTH REALM — the approved design's own decision, and one that silently regressed the first time it was wired: it went in as an ordinary rail item at position four, with a hand-drawn glyph and no rule. Five realms are places to work, Review is the way out. Nothing else can catch this; a rail with six links renders perfectly.
    check('Review renders after a rail rule rather than among the realms', () => {
        const realms = ['season', 'armory', 'broadcast', 'access', 'analytics', 'review'];
        const out = render(html`<${Rail} realm="season" realms=${realms} badges=${{}} />`);
        assert.ok(out.includes('rail-rule'), 'the divider that separates the two kinds must be present');
        assert.ok(out.indexOf('rail-rule') < out.indexOf('href="#/review"'), 'Review comes AFTER the rule');
        for (const r of ['season', 'armory', 'broadcast', 'access', 'analytics']) {
            assert.ok(out.indexOf(`href="#/${r}"`) < out.indexOf('rail-rule'), `${r} belongs before the rule`);
        }
    });

    // The staged count is a property of the CHANGESET, so an Armory edit must not badge Season.
    check('the staged count lands on Review, whatever realm staged the work', () => {
        const realms = ['season', 'armory', 'review'];
        const out = render(html`<${Rail} realm="armory" realms=${realms} badges=${{ review: 3 }} />`);
        const badgeAt = out.indexOf('3 staged');
        assert.ok(badgeAt > -1, 'the count must render');
        assert.ok(badgeAt > out.indexOf('rail-rule'), 'and it must sit on Review, past the rule');
    });

    check('an admin who cannot see Review gets no rule and no way out', () => {
        const out = render(html`<${Rail} realm="season" realms=${['season']} badges=${{}} />`);
        assert.ok(!out.includes('href="#/review"'), 'Review must not appear');
        assert.ok(!out.includes('rail-rule'), 'and neither must a divider dividing nothing');
    });

    check('the masthead is DATA — a title and stats, never an explanatory paragraph', () => {
        const out = render(html`<${Masthead} title="Season 7" sub="2026-08-01 → 2026-09-04"
            stats=${[{ value: 14, label: 'days left' }, { value: 3, label: 'staged', tone: 'hot' }]} />`);
        assert.ok(out.includes('<h1>Season 7</h1>'));
        assert.ok(out.includes('2026-08-01'), 'the context line');
        assert.ok(out.includes('<b>14</b>') && out.includes('days left'), 'a value/label stat pair');
        assert.ok(out.includes('stat hot'), 'the tone modifier reaches the markup');
        assert.ok(!out.includes('<p>'), 'no paragraph — the ANSWERS/prose masthead is reviewer annotation, not chrome');
    });

    check('the door states what the OAuth request actually asks for', () => {
        const out = render(html`<${Door} />`);
        assert.ok(out.includes('/auth/login') && out.includes('door-cta'));
        assert.ok(out.includes('<svg'), 'the Discord mark');
        assert.ok(/user ID and username/.test(out), 'the scope disclosure — this page must not overstate the request');
        assert.ok(/no email, no servers, no messages/.test(out), 'and what it does NOT ask for');
        assert.ok(/12 hours/.test(out), 'what gets stored');
    });

    check('the door reads identically for a forbidden account (spec §10)', () => {
        assert.strictEqual(render(html`<${Door} />`), render(html`<${Door} forbidden=${true} />`),
            'a stranger and a revoked admin must not be distinguishable from the page');
    });

    check('the Manifest renders one row per record, with its topic dot and state pill', () => {
        const out = render(html`<${Manifest} rows=${SEASON_ROWS} columns=${SEASON_COLUMNS} searchableFields=${['title']} />`);
        for (const r of SEASON_ROWS) assert.ok(out.includes(r.title), `${r.title} is present`);
        assert.ok(out.includes('--topic-accent:var(--draw)'), 'the dot carries the row’s own topic token');
        assert.ok(out.includes('--topic-accent:var(--play)'), 'and Playlist is not folded into Event');
        assert.ok(!out.includes('--topic-accent:var(--ink3)'), 'no row falls through to the grey fallback');
        assert.ok(out.includes('stt live') && out.includes('stt stag') && out.includes('stt conf'),
            'three states, three SHAPES — colour alone would not survive greyscale');
        assert.ok(out.includes('class="twrap"'), 'the table sits in its own scroll container');
    });

    check('the Manifest says why a table is empty rather than showing nothing', () => {
        const out = render(html`<${Manifest} rows=${[]} columns=${SEASON_COLUMNS} searchableFields=${['title']} emptyText="This season has no draws yet." />`);
        assert.ok(out.includes('This season has no draws yet.'));
    });

    check('every Manifest control is labelled for a screen reader', () => {
        const out = render(html`<${Manifest} rows=${SEASON_ROWS} columns=${SEASON_COLUMNS} searchableFields=${['title']} />`);
        const labels = (out.match(/class="sr-only"/g) || []).length;
        assert.ok(labels >= SEASON_ROWS.length + 1, `expected a label for the search box and each row checkbox, found ${labels}`);
    });

    check('the Board renders four pipeline columns and each one says what it means', () => {
        // ⚠️ WITH A NON-EMPTY SET. An EMPTY board deliberately renders its explanation INSTEAD of four empty columns — same judgement as hiding a Track lane with nothing in it: structure that announces absent content is worse than a sentence saying so. The first version of this check asserted both at once and failed, which is the component being right and the test being wrong about it.
        const one = [{ _id: 'c1', tier: 1, state: 'staged', realm: 'season', ops: [{ type: 'draw.add', payload: { title: 'Wraith' } }] }];
        const out = render(html`<${Board} changesets=${one} onCommit=${() => {}} onExport=${() => {}} />`);
        for (const label of ['Draft', 'Staged', 'Blocked', 'Ready']) assert.ok(out.includes(`>${label}<`), `${label} column heading`);
        assert.ok(/all of it lands, or none of it does/.test(out), 'Ready states the all-or-nothing contract');
    });

    check('an empty Board explains itself instead of showing four empty columns', () => {
        const out = render(html`<${Board} changesets=${[]} onCommit=${() => {}} onExport=${() => {}} />`);
        assert.ok(/Nothing is staged/.test(out), 'it says what would put something here');
        assert.ok(!out.includes('class="cols"'), 'and does not render the empty pipeline');
    });

    check('a blocked tier-3 card states its reason and offers the export that clears it', () => {
        const sets = [
            { _id: 'c1', tier: 1, state: 'staged', realm: 'season', ops: [{ type: 'calendar.edit', target: { elementId: 'e1' }, payload: { title: 'Clan wars' } }] },
            { _id: 'c2', tier: 3, state: 'staged', exportedAt: null, realm: 'season', ops: [{ type: 'draw.delete', target: { elementId: 'd1' }, payload: {} }] },
        ];
        const out = render(html`<${Board} changesets=${sets} onCommit=${() => {}} onExport=${() => {}} />`);
        assert.ok(out.includes('card t3'), 'the tier-3 card is marked');
        assert.ok(/must be exported before it can commit/.test(out), 'Blocked states WHY, never just "blocked"');
        assert.ok(out.includes('Download'), 'and the control that resolves it');
        assert.ok(/Undo would restore the draw/.test(out), 'each card states its own inverse before you commit it');
        assert.ok(/Edit calendar item/.test(out), 'and describes the op in words, not as "1 op(s)"');
    });

    check('the Ready column OPENS the review — it never commits blind', () => {
        const ready = [{ _id: 'c1', tier: 1, state: 'staged', realm: 'season', ops: [{ type: 'draw.add', target: null, payload: { title: 'Wraith' } }] }];
        const out = render(html`<${Board} changesets=${ready} onCommit=${() => {}} onExport=${() => {}} />`);
        assert.ok(/Review 1 ready/.test(out), 'the control reviews rather than applies');
        assert.ok(!/Commit 1 of 1/.test(out), 'the old blind-commit button is gone');
    });

    check('one blocker holds every staged set out of Ready, in the RENDER not only the logic', () => {
        const mixed = [
            { _id: 'a', tier: 1, state: 'staged', realm: 'season', ops: [{ type: 'draw.add', payload: { title: 'A' } }] },
            { _id: 'b', tier: 3, state: 'staged', exportedAt: null, realm: 'season', ops: [{ type: 'draw.delete', target: {}, payload: {} }] },
        ];
        const out = render(html`<${Board} changesets=${mixed} onCommit=${() => {}} onExport=${() => {}} />`);
        assert.ok(!/Review \d+ ready/.test(out), 'nothing is offered for commit while anything is blocked');
    });

    check('the Shell puts the Manifest under the view layer, on every realm', () => {
        const out = render(html`<${Shell} realm="season" session=${session} view="Track" viewOptions=${['Track', 'Board']}
            onSetView=${() => {}} masthead=${html`<${Masthead} title="Season 7" />`}
            viewSlot=${html`<div id="view-layer"></div>`} manifestSlot=${html`<div id="manifest-layer"></div>`} />`);
        assert.ok(out.indexOf('id="view-layer"') < out.indexOf('id="manifest-layer"'),
            'the Manifest is always BELOW the view layer — spec §8.1, the layer that never switches');
        assert.ok(out.includes('role="tablist"') && out.includes('aria-selected="true"'), 'the view switcher is a real tablist');
        assert.ok(out.indexOf('class="rail"') > -1, 'the rail is part of the shell, not per-realm');
        assert.ok(!/href="#\/season"[^>]*>\s*season\s*<\/a>\s*<a[^>]*>\s*armory/.test(out.replace(/\n/g, '')),
            'realms are rail entries, not a horizontal strip of bare text links');
    });

    check('the view switcher is absent when a realm has only one view', () => {
        const out = render(html`<${Shell} realm="access" session=${session} viewSlot=${html`<div/>`} manifestSlot=${html`<div/>`} />`);
        assert.ok(!out.includes('role="tablist"'), 'no empty tab group on a single-view realm');
    });

    process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('  ✗ harness failed to start\n      ' + e.stack); process.exit(1); });
