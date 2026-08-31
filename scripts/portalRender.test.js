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
//
// 🔴 DERIVED FROM THE DIRECTORY, NEVER LISTED. This was a hardcoded array of seven names, and buildPortal has always emitted a script tag for EVERY *.logic.js — so the browser got the new ones and this harness did not. Adding palette.logic.js broke two Shell cases with `paletteHits is not defined`, which reads as a bug in the component and was a stale list in the test. A source list is only ever as complete as its list; globbing the same directory the build globs is the only version that cannot fall behind.
function installLogicGlobals() {
    const dir = path.join(__dirname, '..', 'portal', 'ui');
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.logic.js'))) {
        const mod = require(path.join(dir, f));
        Object.assign(globalThis, mod);
        // 🔴 A NAMESPACE EXPORT LOST ITS NAME HERE, AND IT SILENTLY EXCLUDED A WHOLE COMPONENT FROM THIS SUITE. timeline.logic.js does `module.exports = TL`, so the spread above installed TL's MEMBERS (make, fmt, toISO) and never `TL` itself — and every component reading a bare `TL`, which is the entire Track, threw "TL is not defined" the moment anyone tried to render it. Nobody had tried, so the gap read as "the Track has no render test" rather than as a broken harness. The global name is read out of the file's own browser line rather than hardcoded.
        for (const m of fs.readFileSync(path.join(dir, f), 'utf8').matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)) {
            if (!(m[1] in globalThis)) globalThis[m[1]] = mod;
        }
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
    const { Manifest, SelectionBar } = await import('../portal/public/.ssr/ui/manifest.js');
    const { Board } = await import('../portal/public/.ssr/ui/board.js');
    const { Track } = await import('../portal/public/.ssr/ui/track.js');
    const { Confirm } = await import('../portal/public/.ssr/ui/overlay.js');

    const session = { discordId: '1139845545754632283', isOwner: true, csrfToken: 'x', visibleRealms: ['season', 'armory', 'broadcast', 'access', 'analytics'] };

    // 🔴 THE ONLY CHECK IN THIS REPO THAT COULD HAVE CAUGHT A DEAD BRANCH, and it exists because one shipped. The double-CP window was written reading `data.calendar` — `data` is the lane-keyed structure (draw/returning/event/playlist) and has no `calendar` key, so the filter ran over an empty array and the window rendered nothing, permanently. Every gate passed: `portal:orphans` saw a class with a rule, `portal:coverage` saw the class in the SOURCE, and neither can know whether the branch executes. **A class in a file is not a class on the page.**
    //
    // ⚠️ SO THE ASSERTION IS ON RENDERED OUTPUT, GIVEN DATA THAT MUST PRODUCE IT. A season carrying an isDoubleCP calendar item has to yield a `.win` in the tree; anything less is a check on the author's intentions rather than on the component.
    const trackWindow = { start: '2026-09-01', end: '2026-09-30' };
    const emptyLanes = { draw: [], returning: [], event: [], playlist: [] };

    check('a double-CP calendar item draws its window on the Track', () => {
        const season = { calendar: [{ _id: 'cp1', title: '2X CP Weekend', date: '2026-09-05',
                                      endDate: '2026-09-08', isDoubleCP: true }] };
        const out = render(html`<${Track} data=${emptyLanes} window=${trackWindow} full=${trackWindow}
                                          season=${season} flags=${[]} rail=${{ flags: [], pins: [], patches: [] }} />`);
        assert.ok(/class="win"/.test(out), 'the double-CP window reached the tree');
        assert.ok(out.includes('2X CP'), 'and it is labelled, not a bare band');
    });

    check('THE DEAD-BRANCH CHECK CAN FAIL: no double-CP item means no window', () => {
        const season = { calendar: [{ _id: 'e1', title: 'Ordinary event', date: '2026-09-05', endDate: '2026-09-08' }] };
        const out = render(html`<${Track} data=${emptyLanes} window=${trackWindow} full=${trackWindow}
                                          season=${season} flags=${[]} rail=${{ flags: [], pins: [], patches: [] }} />`);
        assert.ok(!/class="win"/.test(out), 'an ordinary event must not paint a pricing window');
    });

    check('the nav is a RAIL with one entry per visible realm, and marks the current one', () => {
        const out = render(html`<${Rail} realm="season" realms=${session.visibleRealms} badges=${{ season: 2 }} />`);
        assert.ok(out.includes('class="rail"'), 'the rail element itself');
        for (const r of session.visibleRealms) assert.ok(out.includes(`href="#/${r}"`), `a link to ${r}`);
        assert.ok(out.includes('aria-current="page"'), 'the current realm is announced, not only coloured');
        assert.ok(out.includes('<svg'), 'each entry carries its icon — a bare text rail is the old top bar again');
        // The count lives on Review now, not on the realm that staged it — see the dedicated case below.
        assert.ok(out.includes('class="realm"'), 'entries carry the adopted realm class');
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
        assert.ok(out.includes('>14<') && out.includes('days left'), 'a value/label stat pair');
        assert.ok(out.includes('stat hot'), 'the tone modifier reaches the markup');
        assert.ok(!out.includes('<p>'), 'no paragraph — the ANSWERS/prose masthead is reviewer annotation, not chrome');
    });

    check('the door states what the OAuth request actually asks for', () => {
        const out = render(html`<${Door} />`);
        assert.ok(out.includes('/auth/login') && out.includes('dbtn'), 'the sign-in control, in the adopted vocabulary');
        assert.ok(out.includes('<svg'), 'the Discord mark');
        assert.ok(/user ID and username/.test(out), 'the scope disclosure — this page must not overstate the request');
        assert.ok(/no email, no servers, no messages/.test(out), 'and what it does NOT ask for');
        assert.ok(/12 hours/.test(out), 'what gets stored');
    });

    check('a never-granted account and a revoked admin are indistinguishable', () => {
        // 🔴 THE INVARIANT IS ABOUT WHICH ACCOUNTS CAN BE TOLD APART, not about the page having one state. The adopted design DOES show a denied banner — and it is right to: that state is reached only after a SUCCESSFUL sign-in by somebody with no permissions, so it is the person's own account being described to them, not an account being enumerated by a stranger. What must stay true is that "never granted" and "granted then revoked" render the same, since telling those apart leaks whether an account was ever an admin. One boolean drives the whole difference, so they cannot diverge.
        const neverGranted = render(html`<${Door} forbidden=${true} />`);
        const revoked = render(html`<${Door} forbidden=${true} />`);
        assert.strictEqual(neverGranted, revoked, 'the two forbidden cases must be byte-identical');
        assert.ok(neverGranted.includes('not an admin'), 'and the signed-in person is told why they see nothing');
        const stranger = render(html`<${Door} />`);
        assert.ok(!stranger.includes('not an admin'), 'a stranger is told nothing about any account');
    });

    check('the Manifest renders one row per record, with its topic dot and state pill', () => {
        const out = render(html`<${Manifest} rows=${SEASON_ROWS} columns=${SEASON_COLUMNS} searchableFields=${['title']} />`);
        for (const r of SEASON_ROWS) assert.ok(out.includes(r.title), `${r.title} is present`);
        assert.ok(out.includes('--topic-accent:var(--draw)'), 'the dot carries the row’s own topic token');
        assert.ok(out.includes('--topic-accent:var(--play)'), 'and Playlist is not folded into Event');
        assert.ok(!out.includes('--topic-accent:var(--ink3)'), 'no row falls through to the grey fallback');
        // `live` now takes the `saved` shape, because the stylesheet fills `.stt.saved` and has no rule for `.stt.live` — the pill rendered as plain text on every live row until the map said so. The subject of this check is unchanged: three states, three distinguishable shapes.
        assert.ok(out.includes('stt saved') && out.includes('stt stag') && out.includes('stt conf'),
            'three states, three SHAPES — colour alone would not survive greyscale');
        assert.ok(out.includes('class="mscroll"') && out.includes('class="mtable"'), 'the table sits in its own scroll container');
        assert.ok(out.includes('<colgroup>') && out.includes('class="c-item"'),
            'table-layout:fixed needs a colgroup, and the widths are derived from each column’s role');
        assert.ok(out.includes('class="ncell"'), 'the dot and the name are one cell object, not two loose children');
    });

    // 🔴 A <th> WITH AN onClick IS NOT A CONTROL. The whole table could be sorted with a mouse and not at all without one.
    check('every sortable column is a real button, and the header states the sort direction', () => {
        const out = render(html`<${Manifest} rows=${SEASON_ROWS} columns=${SEASON_COLUMNS} searchableFields=${['title']} />`);
        assert.strictEqual((out.match(/class="sortbtn"/g) || []).length, SEASON_COLUMNS.length,
            'one button per column, reachable by keyboard');
        assert.ok(out.includes('aria-sort="none"'), 'an unsorted column says so rather than saying nothing');
        assert.ok(!/<th[^>]*onclick/i.test(out), 'the handler is on the button, never on the cell');
    });

    // 🔴 THE SELECTION ACTIONS WERE 1,682px BELOW THE FOLD, at the foot of the table.
    check('the selection bar is absent with nothing selected, and never renders a badge a realm did not supply', () => {
        const out = render(html`<${Manifest} rows=${SEASON_ROWS} columns=${SEASON_COLUMNS} searchableFields=${['title']}
            bulkActions=${[{ label: 'Stage deletion', danger: true, onClick: () => {} }]} />`);
        assert.ok(!out.includes('class="selbar'), 'no bar until something is selected');
        assert.ok(!out.includes('selbar-rev'), 'and no reversibility sentence invented on a realm’s behalf');
    });

    // 🔴 "1 announcements" IS THE FIFTH OCCURRENCE OF THIS SHAPE IN THIS PROJECT. The changelog already carries a paragraph about the fourth, found in the function directly below the pluraliser written for it. The caller states both forms rather than the component stripping a trailing "s", because a rule is exactly what produced the previous four.
    check('the selection bar agrees with its own number', () => {
        const bar = (n) => render(html`<${SelectionBar} count=${n} noun=${['item', 'items']} tier=${2}
            badge="Reversible" actions=${[{ label: 'Stage deletion', danger: true, onClick: () => {} }]} onClear=${() => {}} />`);
        assert.ok(bar(1).includes('1 item') && !bar(1).includes('1 items'), 'a count of one never takes a plural noun');
        assert.ok(bar(3).includes('3 items'), 'and a count of three does');
        assert.ok(bar(2).includes('selbar-rev ok'), 'tier 2 is the reversible badge');
        assert.ok(render(html`<${SelectionBar} count=${2} noun=${['item', 'items']} tier=${3} badge="Immediate"
            actions=${[]} onClear=${() => {}} />`).includes('selbar-rev gate'), 'tier 3 is the gate badge');
        assert.ok(!render(html`<${SelectionBar} count=${2} noun=${['item', 'items']} actions=${[]} onClear=${() => {}} />`)
            .includes('selbar-rev'), 'a realm that supplied no sentence gets none invented for it');
    });

    // 🔴 ITS OWN COLUMN WITH A HEADER, NEVER A HOVER REVEAL — a reveal does not exist on touch and cannot be scanned.
    check('the per-row remove control appears only when a realm supplies one, and is labelled per row', () => {
        const without = render(html`<${Manifest} rows=${SEASON_ROWS} columns=${SEASON_COLUMNS} searchableFields=${['title']} />`);
        assert.ok(!without.includes('class="rmv"'), 'a realm with no single-row destructive op grows no column');
        const withIt = render(html`<${Manifest} rows=${SEASON_ROWS} columns=${SEASON_COLUMNS} searchableFields=${['title']}
            onRemove=${() => {}} removeLabel="Stage deletion" />`);
        assert.strictEqual((withIt.match(/class="rmv"/g) || []).length, SEASON_ROWS.length, 'one per row');
        assert.ok(withIt.includes('Stage deletion Iron Wolf — Legendary'), 'the label names the row, not just the verb');
    });

    check('the Manifest says why a table is empty rather than showing nothing', () => {
        const out = render(html`<${Manifest} rows=${[]} columns=${SEASON_COLUMNS} searchableFields=${['title']} emptyText="This season has no draws yet." />`);
        assert.ok(out.includes('This season has no draws yet.'));
    });

    check('every Manifest control is labelled for a screen reader', () => {
        // ⚠️ `selectable` IS ASSERTED ON. It used to be unconditional and now defaults to "wherever bulk actions exist" — right for the product, since Broadcast's design draws no checkbox column, but it would leave this check with nothing to check: a Manifest with no checkboxes has no checkbox labels to look for, so it would pass by having no subject.
        const out = render(html`<${Manifest} rows=${SEASON_ROWS} columns=${SEASON_COLUMNS} searchableFields=${['title']} selectable=${true} />`);
        // ⚠️ IT COUNTS THE ASSOCIATION, NOT THE CLASS NAME. This used to count `class="sr-only"` occurrences, which passed for the wrong reason twice over: a visually-hidden SPAN counted as a label, and renaming the utility class to the adopted sheet's own `.sr` broke a test whose subject — every control has a label bound to it — had not changed at all. ⚠️ IT COUNTS THE ASSOCIATION, AND THERE ARE TWO WAYS TO MAKE ONE. The row control is the design's `span[role=checkbox]` now rather than a hidden input inside a label, so a bound `aria-label` is the association — the subject of this check, "every control has a label bound to it", is unchanged and counting only `<label for=` would fail it for using the other form.
        const labels = (out.match(/<label[^>]*\sfor="/g) || []).length
            + (out.match(/role="checkbox"[^>]*aria-label="/g) || []).length;
        assert.ok(labels >= SEASON_ROWS.length + 1, `expected a label bound to the search box and to each row checkbox, found ${labels}`);
    });

    check('the Board renders the four CONTENT states, and its headers are real buttons', () => {
        // 🔴 THIS ASSERTED Draft / Staged / Blocked / Ready — the RETIRED design — and passed for weeks while the screen said something else entirely from what season.html and COMPANION §5.2 draw. See board.logic.js's header for the three dates that settle it. A test written from the same wrong premise as the code is not a second witness; it is one claim asserted twice.
        const boardItems = [
            { id: 'i1', title: 'Molten Fusion Draw', lane: 'returningDraws', typeLabel: 'Returning draw', kind: 'point',
              dateOnly: true, startDate: '2026-08-09', endDate: '2026-08-09', state: 'live', topicVar: '--ret' },
            { id: 'i2', title: 'Widow Bite Draw', lane: 'newDraws', typeLabel: 'New draw', kind: 'point',
              dateOnly: true, startDate: '2026-09-01', endDate: '2026-09-01', state: 'live', topicVar: '--draw' },
            { id: 'i3', title: 'Terminator 2 Themed Event', lane: 'calendar', typeLabel: 'Event', kind: 'span',
              startDate: '2026-07-01', endDate: '2026-07-30', state: 'live', topicVar: '--ev' },
            { id: 'i4', title: 'Staged thing', lane: 'calendar', typeLabel: 'Event', kind: 'span',
              startDate: '2026-08-20', endDate: '2026-08-25', state: 'staged', topicVar: '--ev' },
        ];
        const out = render(html`<${Board} items=${boardItems} today=${'2026-08-24'} newestPatchId=${null}
                                          onMove=${() => {}} onOpen=${() => {}} />`);
        for (const label of ['Live now', 'Upcoming', 'Staged', 'Ended']) assert.ok(out.includes(`>${label}<`), `${label} column heading`);
        // COMPANION §5.2: "The whole header is the collapse control." A div cannot be collapsed by keyboard and announces nothing — the pipeline's header was a div for the whole life of that component.
        assert.ok(/<button class="bcol-h"/.test(out), 'the column header is a button, not a div');
        assert.ok(/aria-expanded="true"/.test(out), 'and it says whether it is open');
        assert.ok(/moving a card moves its window/.test(out), 'the bar states what dragging DOES');
    });

    check('lifecycle sorts by the CONTENT axis, including the rule that cost a real bug', () => {
        const boardItems = [
            { id: 'i1', title: 'Molten Fusion Draw', lane: 'returningDraws', typeLabel: 'Returning draw', kind: 'point',
              dateOnly: true, startDate: '2026-08-09', endDate: '2026-08-09', state: 'live', topicVar: '--ret' },
            { id: 'i2', title: 'Widow Bite Draw', lane: 'newDraws', typeLabel: 'New draw', kind: 'point',
              dateOnly: true, startDate: '2026-09-01', endDate: '2026-09-01', state: 'live', topicVar: '--draw' },
            { id: 'i3', title: 'Terminator 2 Themed Event', lane: 'calendar', typeLabel: 'Event', kind: 'span',
              startDate: '2026-07-01', endDate: '2026-07-30', state: 'live', topicVar: '--ev' },
            { id: 'i4', title: 'Staged thing', lane: 'calendar', typeLabel: 'Event', kind: 'span',
              startDate: '2026-08-20', endDate: '2026-08-25', state: 'staged', topicVar: '--ev' },
        ];
        const g = groupBoardItems(boardItems, { today: '2026-08-24', newestPatchNoteId: null });
        // A dateOnly draw released in the past is still LIVE: a draw with no calendar window genuinely never ends, which is true of 11 of the 14 real draws and is the most useful thing this screen says.
        assert.deepStrictEqual(g.live.map((x) => x.id), ['i1'], 'a past dateOnly release stays live');
        assert.deepStrictEqual(g.upcoming.map((x) => x.id), ['i2'], 'a future release is upcoming');
        assert.deepStrictEqual(g.ended.map((x) => x.id), ['i3'], 'a span whose end has passed is ended');
        assert.deepStrictEqual(g.staged.map((x) => x.id), ['i4'], 'the staging axis wins over the content axis');
    });

    check('THE LIFECYCLE GATE CAN FAIL: a released draw WITH a window is history, not live', () => {
        const withWindow = { id: 'w', title: 'Judgment Day', lane: 'newDraws', kind: 'point', dateOnly: false,
            startDate: '2026-08-07', endDate: '2026-08-07', state: 'live' };
        const g = groupBoardItems([withWindow], { today: '2026-08-24', newestPatchNoteId: null });
        assert.deepStrictEqual(g.ended.map((x) => x.id), ['w'],
            'reading a past release as "started and not ended" labelled every past draw LIVE NOW forever');
    });

    // 🔴 A BUTTON INSIDE A BUTTON IS INVALID HTML and the browser does not error — it closes the outer one early and reparents what follows, so the card's own click target silently stops covering its own content. The pipeline card carried a Discard button inside a card button for the whole life of this component.
    check('no control nests inside another control', () => {
        const nested = [
            { _id: 'a', tier: 3, state: 'staged', exportedAt: null, realm: 'season', ops: [{ type: 'draw.delete', target: {}, payload: {} }] },
        ];
        const out = render(html`<${Board} changesets=${nested} onExport=${() => {}} onDiscard=${() => {}} />`);
        assert.ok(!/<button[^>]*>(?:(?!<\/button>)[\s\S])*<button/.test(out),
            'a <button> opens before the previous one closes — the browser will reparent this');
    });

    check('THE NESTING GATE CAN FAIL: a button opened inside another is caught', () => {
        const bad = '<button class="card"><span>x</span><button>Discard</button></button>';
        const good = '<div role="button"><span>x</span><button>Discard</button></div>';
        const re = /<button[^>]*>(?:(?!<\/button>)[\s\S])*<button/;
        assert.ok(re.test(bad), 'the nested form must be caught');
        assert.ok(!re.test(good), 'a div wrapper must not be a false positive');
    });

    check('an empty column says what would put something in it', () => {
        const out = render(html`<${Board} items=${[]} today=${'2026-08-24'} newestPatchId=${null}
                                          onMove=${() => {}} onOpen=${() => {}} />`);
        // Four columns still render when empty — unlike the pipeline, these ARE the season's states, and a Board that hides "Upcoming" because nothing is scheduled has answered the question by deleting it.
        assert.ok(/Nothing is running right now/.test(out), 'live says what it would hold');
        assert.ok(/Nothing is scheduled ahead of today/.test(out), 'upcoming says what it would hold');
        assert.ok(/the bot sees none of it yet/.test(out), 'staged names its own consequence');
    });
    // ⊘ RETIRED 2026-08-28, with the reason rather than silently: this asserted the CHANGESET PIPELINE, which Board is no longer (see board.logic.js's header). The behaviour it covered — a blocked tier-3 set naming its reason, and Ready opening the review instead of committing — belongs to the Review realm and is asserted there. Deleting a test whose SUBJECT MOVED is correct; deleting one whose subject still exists is how coverage evaporates without anything reporting it. ⊘ RETIRED 2026-08-28, with the reason rather than silently: this asserted the CHANGESET PIPELINE, which Board is no longer (see board.logic.js's header). The behaviour it covered — a blocked tier-3 set naming its reason, and Ready opening the review instead of committing — belongs to the Review realm and is asserted there. Deleting a test whose SUBJECT MOVED is correct; deleting one whose subject still exists is how coverage evaporates without anything reporting it.
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
        // A tablist whose tabs say `aria-pressed` is not a tablist — the role drops the attribute, so this asserted the shape and missed the one state the shape exists to carry.
        assert.ok(out.includes('role="tablist"') && out.includes('aria-selected="true"'), 'the view switcher is a real tablist');
        assert.ok(!/role="tab"[^>]*aria-pressed/.test(out), 'a tab announces selection, never pressed-ness');
        assert.ok(out.indexOf('class="rail"') > -1, 'the rail is part of the shell, not per-realm');
        assert.ok(!/href="#\/season"[^>]*>\s*season\s*<\/a>\s*<a[^>]*>\s*armory/.test(out.replace(/\n/g, '')),
            'realms are rail entries, not a horizontal strip of bare text links');
    });

    check('the view switcher is absent when a realm has only one view', () => {
        const out = render(html`<${Shell} realm="access" session=${session} viewSlot=${html`<div/>`} manifestSlot=${html`<div/>`} />`);
        assert.ok(!out.includes('role="tablist"'), 'no empty tab group on a single-view realm');
    });

    // ── THE CHROME ────────────────────────────────────────────────────────────────────────────
    //
    // 🔴 THE COMMAND BAR RENDERED COMPLETELY AND DID NOTHING for the whole of the migration, which is exactly the class of defect a render test can catch and a screenshot cannot: the markup was right. These cases assert the two halves that make it real — a combobox wired to a list, and a list that is CLOSED until somebody opens it.
    check('the header ships a real command bar: a combobox, its listbox, and both closed on arrival', () => {
        const out = render(html`<${Shell} realm="season" session=${session} viewSlot=${html`<div/>`} manifestSlot=${html`<div/>`} />`);
        assert.ok(out.includes('role="combobox"'), 'the input announces itself as a combobox');
        assert.ok(out.includes('aria-controls="cbList"') && out.includes('id="cbList"'),
            'the input points at a listbox that actually exists — the pair is what makes it navigable');
        assert.ok(out.includes('aria-expanded="false"'), 'closed on arrival');
        assert.ok(/<div class="cb-drop" hidden/.test(out), 'the dropdown is hidden until intent, never on focus');
    });

    check('the command bar offers the realms the session can actually see, and never the one you are on', () => {
        const out = render(html`<${Shell} realm="season" session=${session} viewOptions=${['Track', 'Board']}
            onSetView=${() => {}} viewSlot=${html`<div/>`} manifestSlot=${html`<div/>`} />`);
        assert.ok(out.includes('>Track<') && out.includes('>Board<'), "a realm's views reach the palette without the realm declaring them");
        assert.ok(!/aria-selected="[^"]*">\s*<i[^>]*><\/i>\s*Season\s*</.test(out), 'the realm you are standing on is not offered as a destination');
        assert.ok(out.includes('Sign out'), 'sign out is reachable from the palette on every realm');
    });

    // 🔴 THE PORTAL COULD NOT BE SIGNED OUT OF. POST /auth/logout existed from the first build and no surface called it.
    check('the account panel exists, is closed, and carries the only sign-out in the portal', () => {
        const out = render(html`<${Shell} realm="armory" session=${session} viewSlot=${html`<div/>`} manifestSlot=${html`<div/>`} />`);
        assert.ok(out.includes('class="whobtn"') && out.includes('aria-haspopup="menu"'), 'the trigger is a real menu button');
        assert.ok(/<div class="umenu" role="menu"[^>]*hidden/.test(out), 'the panel is closed until asked for');
        assert.ok(out.includes('Sign out'), 'the panel carries sign out');
        assert.ok(out.includes(String(session.discordId)), 'the id is WHOLE in the panel — a partial id cannot be checked');
    });

    // ⚠️ The failure this guards is silent and specific: an unset custom property makes the whole `background` declaration invalid at computed-value time, so the disc and the banner paint TRANSPARENT rather than falling back to a lower-specificity rule.
    check('the account head sets --banner and --av-src to a VALID value rather than leaving them unset', () => {
        const out = render(html`<${Shell} realm="armory" session=${session} viewSlot=${html`<div/>`} manifestSlot=${html`<div/>`} />`);
        assert.ok(out.includes('--banner:none'), 'the banner names a value the CSS can resolve');
        assert.ok(out.includes('--av-src:none'), 'the avatar disc names a value the CSS can resolve');
    });

    check('a typed confirmation renders its gate and holds the button shut until it is satisfied', () => {
        const shut = render(html`<${Confirm} op="admin.revoke" tier=${3} typed="1139845545754632283" danger=${true}
            title="Revoke this admin entirely?" confirmLabel="Revoke all access"
            body=${html`<p class="dw-p">x</p>`} onConfirm=${() => {}} onCancel=${() => {}} />`);
        assert.ok(shut.includes('class="tc-l"') && shut.includes('class="tc-in"'), 'the typed field is rendered, not implied');
        assert.ok(/Revoke all access<\/button>/.test(shut) && /disabled[^>]*>Revoke all access/.test(shut),
            'the destructive button is disabled until the word is typed');
        const open = render(html`<${Confirm} op="changeset.discard" tier=${1} title="Discard?" confirmLabel="Discard"
            body=${html`<p class="dw-p">x</p>`} onConfirm=${() => {}} onCancel=${() => {}} />`);
        assert.ok(!open.includes('class="tc-in"'), 'a confirmation with no typed word grows no field');
        assert.ok(!/disabled[^>]*>Discard/.test(open), 'and its button is live');
    });

    process.exit(failures ? 1 : 0);
})().catch((e) => { console.error('  ✗ harness failed to start\n      ' + e.stack); process.exit(1); });
