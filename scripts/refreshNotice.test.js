// scripts/refreshNotice.test.js
// Regression test for buildRefreshNotice in utils/colorPaletteView.js -- the ephemeral follow-up the
// "Refresh Colors" button sends. Added 2026-08-12 21:52 EDT, rewritten 23:47 EDT for Harkirat's spec.
// Run: `node scripts/refreshNotice.test.js` (also via `npm test`).
//
// ⚠️ WHY THIS EXISTS. This message has three states, two per-profile lists and a decision about which
// list the PRESSED source belongs in — and every combination is invisible until somebody presses the
// button while their account happens to be in exactly that state. It lived inline in handlers/colors.js's refresh
// handler, where none of it could be exercised without a live interaction, a Mongo document and a
// Discord round trip. It was extracted specifically so the branches could be read off as a function of
// their inputs.
//
// ⚠️ AND THE FAILURES ARE ALL COSMETIC-LOOKING, which is why they survive. A missing "Server Profile"
// row does not error; it just means a user is told nothing happened to colours that did change, and
// goes looking for a button to press — the exact complaint that produced this rework
// (Harkirat 2026-08-12 21:39 EDT: "it's just unintuitive to make the user press it for global colors
// and then switch to server colors and press it again").
//
// ⚠️ THE COPY IS HARKIRAT'S, SPECIFIED TO THE CHARACTER 2026-08-12 23:41 EDT. These cases pin the
// SHAPE, not his exact sentences, except where a specific phrase was the point of a revision — those
// are asserted verbatim so a well-meaning rewording fails here instead of shipping.
const assert = require('assert');
const { buildRefreshNotice, SOURCE_META } = require('../utils/colorPaletteView');
const emojis = require('../utils/emojiMap');

let failed = 0;
let passed = 0;
// Counted, never hardcoded -- a literal total in the summary is a copy of state that rots the moment
// a case is added.
function t(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  PASS  ${name}`);
    } catch (err) {
        failed++;
        console.log(`  FAIL  ${name}\n        ${err.message}`);
    }
}

// Labels and emoji are read from their real sources rather than written out, so a rename does not
// silently make these assertions test nothing.
const L = kind => SOURCE_META[kind].label;
const lines = s => s.split('\n');
const base = { source: 'avatar', activeIsGuild: false, changed: false, accentCleared: false, refreshed: [] };
const notice = over => buildRefreshNotice({ ...base, ...over });

console.log('\nthe Refresh Colors follow-up — three states, two profiles\n');

// --- State 1: something was refreshed.
t('any refresh at all reports "New colors found", not a per-source verdict', () => {
    // ⚠️ THE HEADLINE IS ABOUT THE PRESS. Reporting it per-source is what made the old message insist
    // nothing had happened while it had quietly updated three other pages.
    const m = notice({ changed: false, refreshed: [{ kind: 'banner', isGuild: false }] });
    assert.ok(m.startsWith(`### ${emojis.eyedropper}`), `wrong leading emoji: ${m}`);
    assert.ok(/New colors found!/.test(m), m);
    assert.ok(!/\*\*Avatar\*\* —/.test(m), `the headline still names the pressed source: ${m}`);
});

t('the two profiles get their own rows, each naming sources on the NEXT line', () => {
    const m = notice({
        changed: true,
        refreshed: [{ kind: 'banner', isGuild: false }, { kind: 'nameplate', isGuild: true }]
    });
    const ls = lines(m);
    const mainAt = ls.findIndex(l => l.includes('Refreshed Main Profile:'));
    const serverAt = ls.findIndex(l => l.includes('Refreshed Server Profile:'));
    assert.ok(mainAt >= 0 && serverAt >= 0, `expected both rows:\n${m}`);
    // The names sit on the line AFTER their label, wrapped in bold code spans.
    assert.ok(ls[mainAt + 1].includes(`\`${L('avatar')}\``) && ls[mainAt + 1].includes(`\`${L('banner')}\``), ls[mainAt + 1]);
    assert.ok(ls[serverAt + 1].includes(`\`${L('nameplate')}\``), ls[serverAt + 1]);
    assert.ok(ls[mainAt + 1].startsWith('**') && ls[mainAt + 1].endsWith('**'), `name line is not bold-wrapped: ${ls[mainAt + 1]}`);
});

t('the PRESSED source lands in the profile it actually resolved from', () => {
    // Not the view the panel is in: a source with no server override resolves to the global image even
    // in the server view. Getting this wrong files a global refresh under "Server Profile".
    const asGuild = notice({ changed: true, activeIsGuild: true });
    assert.ok(/Server Profile:/.test(asGuild) && !/Main Profile:/.test(asGuild), asGuild);
    const asGlobal = notice({ changed: true, activeIsGuild: false });
    assert.ok(/Main Profile:/.test(asGlobal) && !/Server Profile:/.test(asGlobal), asGlobal);
});

t('the pressed source is listed ONLY when it actually changed', () => {
    // It gets refreshed unconditionally (that is what the button targets), so listing it regardless
    // would claim new colours for a source that produced the same ones.
    const m = notice({ changed: false, refreshed: [{ kind: 'banner', isGuild: false }] });
    assert.ok(!m.includes(`\`${L('avatar')}\``), `an unchanged pressed source was listed: ${m}`);
});

t('an empty profile row is omitted entirely, not rendered blank', () => {
    const m = notice({ changed: true, refreshed: [] });
    assert.ok(!/Server Profile/.test(m), `an empty server row was rendered: ${m}`);
});

t('the reassurance line closes the refreshed state', () => {
    // Unconditional by design: the doubt that started this rework was "did it do the others?", so the
    // message answers it every time rather than only when it can enumerate a leftover.
    const m = notice({ changed: true });
    assert.ok(m.trimEnd().endsWith('Everything else is already up-to-date.*'), m);
});

// --- State 2: nothing refreshed, but the accent cache was cleared.
t('an accent-only refresh keeps the per-source line and the eyedropper', () => {
    const m = notice({ accentCleared: true });
    assert.ok(m.startsWith(`### ${emojis.eyedropper}`), m);
    assert.ok(m.includes(`**${L('avatar')}**`), m);
    assert.ok(/accent color was stale/.test(m), m);
    assert.ok(!/New colors found/.test(m), `an accent-only refresh claimed new colors: ${m}`);
});

// --- State 3: nothing happened at all.
t('a fully unchanged press uses the Swatches emoji and says so plainly', () => {
    const m = notice({});
    assert.ok(m.startsWith(`### ${emojis.swatches}`), `wrong leading emoji: ${m}`);
    assert.ok(/\*\*All colors are already up-to-date!\*\*/.test(m), m);
    assert.ok(/The same image always gives the same colors/.test(m), m);
    // The wording two revisions ago. Asserted ABSENT because removing the lecture was the point.
    assert.ok(!/not to reroll/.test(m), `the old lecture is back: ${m}`);
});

t('the three states are mutually exclusive', () => {
    // A refresh outranks an accent clear, which outranks nothing. Two headlines in one message would
    // mean the state machine has a hole.
    const both = notice({ changed: true, accentCleared: true });
    assert.ok(/New colors found/.test(both) && !/accent color was stale/.test(both), both);
    for (const m of [notice({ changed: true }), notice({ accentCleared: true })]) {
        assert.ok(!/All colors are already up-to-date/.test(m), `claimed nothing happened after a change: ${m}`);
    }
});

// --- Cross-cutting.
t('sources are labelled, never printed as raw keys', () => {
    // `decoration` renders as "Deco"; a raw key leaking through is the tell that SOURCE_META was
    // bypassed.
    const m = notice({ changed: true, refreshed: [{ kind: 'decoration', isGuild: false }] });
    assert.ok(m.includes(`\`${L('decoration')}\``), m);
    assert.ok(!/\bdecoration\b/.test(m), `a raw source key leaked into the message: ${m}`);
});

t('an unknown source degrades to its key instead of throwing', () => {
    // handlers/colors.js passes whatever the custom_id carried; a message that throws would take the whole
    // follow-up with it after the panel has already been edited.
    const m = notice({ source: 'somethingNew', accentCleared: true });
    assert.ok(m.includes('somethingNew'), m);
});

t('every emoji in the notice is read at RENDER time, never frozen at require()', () => {
    // utils/emojiMap.js rewrites its own values at boot to whichever application is running, so a
    // value captured when this module loaded would render a PROD id on the dev bot forever. Proven by
    // mutating the map and re-rendering. See [[project_emoji_require_time_capture]].
    const real = emojis.swatches;
    try {
        emojis.swatches = '<a:Swatches:999999999999999999>';
        assert.ok(notice({}).includes('999999999999999999'), 'the notice froze an emoji value at require() time');
    } finally {
        emojis.swatches = real;
    }
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
