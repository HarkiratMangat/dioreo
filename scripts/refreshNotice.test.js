// scripts/refreshNotice.test.js
// Regression test for buildRefreshNotice in utils/colorPaletteView.js -- the ephemeral follow-up the
// "Refresh Colors" button sends. Added 2026-08-12 21:52 EDT.
// Run: `node scripts/refreshNotice.test.js` (also via `npm test`).
//
// ⚠️ WHY THIS EXISTS. This message has three verdicts, two per-view lists and a trailing line that is
// mutually exclusive with those lists — and EVERY combination is invisible until somebody presses the
// button while their account happens to be in exactly that state. It lived inline in index.js's
// refresh handler, where none of it could be exercised without a live interaction, a Mongo document
// and a Discord round trip. It was extracted specifically so the branches could be read off as a
// function of their inputs.
//
// ⚠️ AND THE FAILURES ARE ALL COSMETIC-LOOKING, which is why they survive. A missing "Server profile"
// row does not error; it just means a user is told nothing happened to colours that did change, and
// goes looking for a button to press — the exact complaint that produced this rework
// (Harkirat 2026-08-12 21:39 EDT: "it's just unintuitive to make the user press it for global colors
// and then switch to server colors and press it again").
const assert = require('assert');
const { buildRefreshNotice, SOURCE_META } = require('../utils/colorPaletteView');

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

// Labels are read from SOURCE_META rather than written out, so a label rename does not silently make
// these assertions test nothing.
const L = kind => SOURCE_META[kind].label;
const lines = s => s.split('\n');

console.log('\nthe Refresh Colors follow-up — three verdicts, two views, one trailing line\n');

// --- The three verdicts.
t('a changed source reports new colors', () => {
    const m = buildRefreshNotice({ source: 'avatar', changed: true, accentCleared: false });
    assert.ok(m.startsWith(`✅ **${L('avatar')}**`), m);
    assert.ok(/new colors/i.test(m), m);
});

t('an unchanged source with a stale accent says so, and does NOT claim new colors', () => {
    // The 2026-08-11 22:20 EDT bug in its permanent form: the palette matched, but the press had a
    // real, visible side effect and the message used to deny it.
    const m = buildRefreshNotice({ source: 'banner', changed: false, accentCleared: true });
    assert.ok(/accent color was stale/i.test(m), m);
    assert.ok(!/new colors/i.test(m), `an accent-only refresh claimed new colors: ${m}`);
});

t('a fully unchanged source says it is up to date, without a lecture', () => {
    const m = buildRefreshNotice({ source: 'avatar', changed: false, accentCleared: false });
    assert.ok(/already up to date/i.test(m), m);
    // The wording this replaced. It is asserted ABSENT rather than merely "not required", because the
    // whole point of the rework was that it read as a telling-off.
    assert.ok(!/not to reroll/i.test(m), `the old lecture is back: ${m}`);
});

// --- The two per-view rows. This is the half the rework exists for.
t('global and server sources are named on SEPARATE rows', () => {
    const m = buildRefreshNotice({
        source: 'avatar', changed: true, accentCleared: false,
        refreshed: [{ kind: 'banner', isGuild: false }, { kind: 'avatar', isGuild: true }]
    });
    const global = lines(m).find(l => l.includes('Also refreshed'));
    const server = lines(m).find(l => l.includes('Server profile'));
    assert.ok(global && server, `expected both rows, got:\n${m}`);
    assert.ok(global.includes(L('banner')), `the global row is missing its source: ${global}`);
    assert.ok(server.includes(L('avatar')), `the server row is missing its source: ${server}`);
    assert.ok(!global.includes('Server'), `the two views bled into one row: ${global}`);
});

t('a guild-only refresh renders the server row and NOT an empty global one', () => {
    const m = buildRefreshNotice({
        source: 'avatar', changed: true, accentCleared: false,
        refreshed: [{ kind: 'banner', isGuild: true }]
    });
    assert.ok(m.includes('Server profile'), m);
    assert.ok(!m.includes('Also refreshed'), `an empty global row was rendered: ${m}`);
});

t('sources are labelled, never printed as raw keys', () => {
    // `decoration` renders as "Deco"; a raw key leaking through is the tell that SOURCE_META was
    // bypassed.
    const m = buildRefreshNotice({
        source: 'avatar', changed: true, accentCleared: false,
        refreshed: [{ kind: 'decoration', isGuild: false }]
    });
    assert.ok(m.includes(L('decoration')), m);
    assert.ok(!/\bdecoration\b/.test(m), `a raw source key leaked into the message: ${m}`);
});

// --- The trailing line, which is the rule most likely to rot.
t('the trailing line is EXCLUSIVE — a pointer when pages moved, never both', () => {
    const m = buildRefreshNotice({
        source: 'avatar', changed: false, accentCleared: false,
        refreshed: [{ kind: 'banner', isGuild: false }]
    });
    assert.ok(/to see them/.test(m), `no pointer despite another page moving: ${m}`);
    assert.ok(!/same picture always/.test(m), `both trailing lines rendered at once: ${m}`);
});

t('the explanation appears ONLY when genuinely nothing happened', () => {
    const nothing = buildRefreshNotice({ source: 'avatar', changed: false, accentCleared: false });
    assert.ok(/same picture always/.test(nothing), nothing);
    // ...and never when something did, in either of the two ways something can.
    for (const m of [
        buildRefreshNotice({ source: 'avatar', changed: true, accentCleared: false }),
        buildRefreshNotice({ source: 'avatar', changed: false, accentCleared: true })
    ]) {
        assert.ok(!/same picture always/.test(m), `explained "nothing changed" after a real change: ${m}`);
    }
});

t('the pointer agrees with itself on plural', () => {
    const one = buildRefreshNotice({
        source: 'avatar', changed: true, accentCleared: false,
        refreshed: [{ kind: 'banner', isGuild: false }]
    });
    const two = buildRefreshNotice({
        source: 'avatar', changed: true, accentCleared: false,
        refreshed: [{ kind: 'banner', isGuild: false }, { kind: 'avatar', isGuild: true }]
    });
    assert.ok(/that page/.test(one), one);
    assert.ok(/those pages/.test(two), two);
});

// --- The size budget. "Concise" was the actual request; without a check it is an intention.
t('the notice never exceeds four lines', () => {
    const worst = buildRefreshNotice({
        source: 'avatar', changed: false, accentCleared: true,
        refreshed: [
            { kind: 'banner', isGuild: false }, { kind: 'decoration', isGuild: false },
            { kind: 'nameplate', isGuild: false }, { kind: 'avatar', isGuild: true },
            { kind: 'banner', isGuild: true }
        ]
    });
    assert.ok(lines(worst).length <= 4, `the worst case runs ${lines(worst).length} lines:\n${worst}`);
});

t('every line after the first is subtext', () => {
    // The verdict is the only body-size line; everything else is `-#`. Without this the message grows
    // visually even when it does not grow in line count.
    const m = buildRefreshNotice({
        source: 'avatar', changed: true, accentCleared: false,
        refreshed: [{ kind: 'banner', isGuild: false }, { kind: 'avatar', isGuild: true }]
    });
    for (const line of lines(m).slice(1)) {
        assert.ok(line.startsWith('-# '), `a non-subtext line follows the verdict: ${line}`);
    }
});

t('an unknown source degrades to its key instead of throwing', () => {
    // index.js passes whatever the custom_id carried; a message that throws would take the whole
    // follow-up with it after the panel has already been edited.
    const m = buildRefreshNotice({ source: 'somethingNew', changed: true, accentCleared: false });
    assert.ok(m.includes('somethingNew'), m);
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
