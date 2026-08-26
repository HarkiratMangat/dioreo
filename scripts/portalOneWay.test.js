// scripts/portalOneWay.test.js — the strip where tier 3 lives.
//
// 🔴 SEVEN TIER-3 OPERATIONS WERE UNREACHABLE FROM THE PORTAL FOR THE WHOLE MIGRATION, and the reason nothing caught it is worth more than the fix: every gate here measures what the code DOES. A capability with a permission token, a commit gate and no affordance does nothing, so there was nothing to measure. The conservation check below is the shape that can see it — it counts the tier-3 ops the registry declares against the rows the strip offers, so an op added to core/ops without a way to run it fails this file instead of going quiet.
const assert = require('assert');
const { oneWayItems, whyNoDestroy, owRowState, plural } = require('../portal/ui/oneway.logic');

let failures = 0;
const say = console.log.bind(console);
function check(name, fn) {
    try { fn(); say(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

say('portalOneWay — is every irreversible operation reachable, and gated?');

// ⚠️ SHAPED LIKE THE ROUTE, NOT LIKE THE COMPONENT. portal/api/season.js answers { live, draft } with draft destructured OUT of live, and the first version of this fixture put draft on live — so it proved the code agreed with itself while the promote row read "No draft is active" over an active draft in the running portal. A fixture is only a falsifier if it is shaped like the thing that actually arrives.
const LIVE = {
    currentSeasonTitle: 'Season 7',
    newDraws: [{ title: 'a' }, { title: 'b' }, { title: 'c' }],
    returningDraws: [{ title: 'd' }],
    calendar: [{ title: 'e' }, { title: 'f' }],
    patchNotes: [{ title: 'g' }],
};

check('THE FIXTURE MATCHES THE ROUTE: /api/season strips draft out of live', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'portal', 'api', 'season.js'), 'utf8');
    assert.match(src, /const \{ draft, [^}]*\}\s*=\s*doc/, 'the route no longer destructures draft out of live — this whole file\'s fixture shape is now wrong');
    assert.strictEqual(LIVE.draft, undefined, 'live must never carry draft, because the route cannot produce that');
});

// 🔴 THE CONSERVATION CHECK. Reads the real registry rather than a list retyped here, because a list retyped here would agree with itself forever — which is exactly how the gap it is meant to catch came about.
check('every tier-3 op that has a /manage action is offered by the strip', () => {
    const ops = require('../core/ops');
    const declared = ops.listOpTypes().filter((t) => {
        const impl = ops.resolveOp(t);
        // Inverse-only ops (no `action`) are reachable ONLY as another op's invert target. There must be no button for them, so they are excluded here by the same property that makes them inverse-only.
        return impl.tier === 3 && impl.action;
    }).sort();
    assert.ok(declared.length >= 4, `the registry scan found ${declared.length} tier-3 ops — too few to be real, so this check would be vacuous`);
    const offered = new Set(oneWayItems(LIVE).map((i) => i.op.type));
    const missing = declared.filter((t) => !offered.has(t));
    assert.deepStrictEqual(missing, [], `core/ops declares ${missing.join(', ')} as tier 3 with a real action, and no row runs it`);
});

check('THE CONSERVATION CHECK CAN FAIL: an op with no row is caught', () => {
    const offered = new Set(['draw.purge']);
    assert.throws(() => {
        const missing = ['draw.purge', 'calendar.purge'].filter((t) => !offered.has(t));
        assert.deepStrictEqual(missing, [], `unreached: ${missing.join(', ')}`);
    }, /unreached: calendar\.purge/);
});

// 🔴 THE SAME ABSENCE, ONE CATEGORY OVER. The portal could PROMOTE a draft it had no way to create: five draft ops exist, /manage reaches all five, the portal reached none — so the promote row was an action on a thing nobody could make. This is the conservation check for that, and it is a SOURCE SCAN rather than a call, because the wiring lives in portal/ui/season.js which is ESM the browser loads and Node cannot require. Weaker than executing it; strong enough to fail loudly when an op is added with no way to reach it, which is the failure that actually happens.
check('every season op with a /manage action is reachable from the portal', () => {
    const fs = require('fs'), path = require('path');
    const ops = require('../core/ops');
    const ui = ['season.js', 'oneway.logic.js', 'season.logic.js', 'board.logic.js', 'track.logic.js']
        .map((f) => fs.readFileSync(path.join(__dirname, '..', 'portal', 'ui', f), 'utf8')).join('\n');
    const declared = ops.listOpTypes().filter((t) => t.startsWith('season.') && ops.resolveOp(t).action).sort();
    assert.ok(declared.length >= 5, `found ${declared.length} season ops with actions — too few for this check to mean anything`);
    const unreachable = declared.filter((t) => !ui.includes(`'${t}'`));
    assert.deepStrictEqual(unreachable, [], `core/ops declares ${unreachable.join(', ')} and no portal surface names it`);
});

check('THE REACHABILITY CHECK CAN FAIL: an op named nowhere in the UI is caught', () => {
    const ui = "type: 'season.startNew'";
    assert.throws(() => {
        const unreachable = ['season.startNew', 'season.discardDraft'].filter((t) => !ui.includes(`'${t}'`));
        assert.deepStrictEqual(unreachable, [], `unreachable: ${unreachable.join(', ')}`);
    }, /unreachable: season\.discardDraft/);
});

check('each row counts the records it would actually destroy', () => {
    const by = Object.fromEntries(oneWayItems(LIVE).map((i) => [i.id, i]));
    assert.strictEqual(by['draws-all'].count, 4);
    assert.strictEqual(by['draws-new'].count, 3);
    assert.strictEqual(by['draws-returning'].count, 1);
    assert.strictEqual(by.calendar.count, 2);
    assert.strictEqual(by.patchnotes.count, 1);
    // startNew wipes draws AND the calendar but leaves patch notes, which is what its own apply() does — a count that quietly included them would overstate the damage and, worse, teach the reader that patch notes are lost when they are not.
    assert.strictEqual(by.startnew.count, 6);
});

check('the purge scopes are the three the op validates, spelled its way', () => {
    const scopes = oneWayItems(LIVE).filter((i) => i.op.type === 'draw.purge').map((i) => i.op.target.scope).sort();
    assert.deepStrictEqual(scopes, ['all', 'new', 'returning']);
});

check('a row with nothing to remove offers no button to press', () => {
    const empty = oneWayItems({ newDraws: [], returningDraws: [], calendar: [], patchNotes: [] });
    for (const item of empty) {
        assert.notStrictEqual(owRowState(item, { canDestroy: true }).state, 'ready',
            `${item.id} offers a purge over zero records`);
    }
});

check('promote is disabled with a reason when no draft exists, and live when one does', () => {
    const noDraft = oneWayItems(LIVE, null).find((i) => i.id === 'promote');
    // An INACTIVE draft object is not a draft. The schema keeps the subdocument around with active:false after a discard, so a truthiness test on the object alone would offer a promote over a draft that was thrown away.
    assert.strictEqual(owRowState(oneWayItems(LIVE, { active: false, newDraws: [1] }).find((i) => i.id === 'promote'),
        { canDestroy: true }).state, 'empty');
    assert.strictEqual(owRowState(noDraft, { canDestroy: true }).state, 'empty');
    assert.match(noDraft.note, /No draft is active/);
    const withDraft = oneWayItems(LIVE, { active: true, newDraws: [1, 2], returningDraws: [], calendar: [3] })
        .find((i) => i.id === 'promote');
    assert.strictEqual(withDraft.count, 3);
    assert.strictEqual(owRowState(withDraft, { canDestroy: true }).state, 'ready');
});

// ⚠️ season.startNew REFUSES TO VALIDATE WITHOUT A TITLE, so a row that asked only for a confirmation word would stage an op the server rejects — a button that looks like it worked and did not.
check('starting a new season needs its title before the button is live', () => {
    const row = oneWayItems(LIVE).find((i) => i.id === 'startnew');
    assert.strictEqual(owRowState(row, { canDestroy: true, fieldValue: '' }).state, 'needs-field');
    assert.strictEqual(owRowState(row, { canDestroy: true, fieldValue: '   ' }).state, 'needs-field',
        'whitespace is not a title — core/ops/season.js trims before it checks');
    assert.strictEqual(owRowState(row, { canDestroy: true, fieldValue: 'Season 8' }).state, 'ready');
});

// 🔴 DISABLED WITH THE REASON, NEVER HIDDEN. Hiding these from an admin who cannot run them teaches nothing and conceals that somebody else can do this to their data.
check('without the permission every row is still present, and every one is locked', () => {
    const rows = oneWayItems(LIVE);
    const states = rows.map((i) => owRowState(i, { canDestroy: false, fieldValue: 'Season 8' }));
    assert.strictEqual(states.length, rows.length, 'no row may disappear');
    assert.ok(states.every((s) => s.state === 'locked'), 'a row must never be runnable without the permission');
    assert.match(whyNoDestroy({ canDestroy: false }), /Destructive/);
    assert.strictEqual(whyNoDestroy({ canDestroy: true }), '');
});

check('THE PERMISSION GATE CAN FAIL: a row runnable without the permission is caught', () => {
    assert.throws(() => {
        const states = [{ state: 'locked' }, { state: 'ready' }];
        assert.ok(states.every((s) => s.state === 'locked'), 'a row is runnable without the permission');
    }, /runnable without the permission/);
});

check('one record is not "1 draws"', () => {
    assert.strictEqual(plural(1, 'draws'), 'draw');
    assert.strictEqual(plural(2, 'draws'), 'draws');
    assert.strictEqual(plural(0, 'draws'), 'draws');
    assert.strictEqual(plural(1, 'staged items'), 'staged item');
});

say(failures ? `\n✗ ${failures} failed` : '\n✅ portalOneWay: every tier-3 op has a row, and no row runs without the permission');
process.exit(failures ? 1 : 0);
