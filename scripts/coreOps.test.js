// scripts/coreOps.test.js
const assert = require('assert');
const { ACTIONS_BY_PAGE } = require('../utils/manageActions');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('every registered op type resolves to all four verbs', () => {
    for (const type of ops.listOpTypes()) {
        const impl = ops.resolveOp(type);
        for (const verb of ['validate', 'preview', 'apply', 'invert']) {
            assert.strictEqual(typeof impl[verb], 'function', `${type} is missing ${verb}()`);
        }
    }
});

check('every mutating draws action maps to an op type', () => {
    const nonMutating = new Set(['formatguide', 'exportnew', 'exportreturning']);
    for (const a of ACTIONS_BY_PAGE.draws) {
        if (nonMutating.has(a.id)) continue;
        assert.ok(ops.opTypeForAction('draws', a.id),
            `draws:${a.id} has no op type — a button with no core behind it`);
    }
});

check('every draws op type maps back to a registry action', () => {
    for (const type of ops.listOpTypes().filter(t => t.startsWith('draw.'))) {
        assert.ok(ops.actionForOpType(type),
            `${type} maps to no registry action — dead core code`);
    }
});

// Pulled forward from plan 2's own Task 7 (undoRetired.test.js) rather than waiting for handler wiring to discover it -- this is what caught core/ops/loadouts.js declaring only 'loadouts_mp:*' actions and leaving all six 'loadouts_dmz:*' registry actions with no op at all.
check('every mutating action on EVERY page (not just draws) resolves to an op type', () => {
    const nonMutating = new Set(['formatguide', 'exportnew', 'exportreturning', 'export',
                                  'exportall', 'exportupto5', 'exportcategory']);
    const missing = [];
    for (const [page, list] of Object.entries(ACTIONS_BY_PAGE)) {
        for (const a of list) {
            if (nonMutating.has(a.id)) continue;
            if (!ops.opTypeForAction(page, a.id)) missing.push(`${page}:${a.id}`);
        }
    }
    assert.deepStrictEqual(missing, [], `actions with no op behind them: ${missing.join(', ')}`);
});

// The inverse direction, all pages. A handful of op types are INTENTIONALLY exempt -- each is an internal-only inverse target (never reachable from /manage, carries no `action` key by design) or, for patchnote.editSeason, a real mutation whose real custom_id embeds a Mongo _id that utils/manageActions.js's page:id split cannot represent (same reason the announcement per-row buttons aren't in the registry either). A reason is required for every entry, same convention as the plan's own note for season.restoreSnapshot -- an unexplained exemption list defeats the check.
check('every op type maps back to a registry action, except the documented internal-only ones', () => {
    const exempt = new Set([
        'season.restoreSnapshot',  // internal -- promoteDraft/startNew's inverse target only
        'season.restoreDraft',     // internal -- discardDraft's inverse target only
        'patchnote.removeSeason',  // internal -- addSeason's inverse target only
        'patchnote.restoreSeason', // internal -- removeSeason's inverse target only
        'patchnote.restore',       // internal -- purge's inverse target only
        'patchnote.editSeason'     // real, but reached via a Mongo-_id-embedding custom_id the
                                    // registry's group/action split can't represent
    ]);
    for (const type of ops.listOpTypes()) {
        if (exempt.has(type)) continue;
        assert.ok(ops.actionForOpType(type), `${type} maps to no registry action — dead core code`);
    }
});

// 🔴 THE PERMISSION CHECK'S OWN PRECONDITION, and nothing asserted it until 2026-08-23. handlers/bot.js and portal/api/changesets.js both gate revert and change-detail on hasManagePageAccess(userId, row.page), where row.page is whatever core/changeset.js's pageForOp() emitted. If that produces a string MANAGE_PAGE_SCOPES does not contain, the check cannot match ANY grant -- it is not a stricter gate, it is a gate comparing against nothing. That is exactly what happened: the six action-less ops fell through to `op.type.split('.')[0]`, stamping `patchnote` (singular) on four patch-note rows and `season` on a DRAFT restore, so a scoped `manage.patchnotes` admin was silently denied and a `manage.season`-only admin was silently ALLOWED to revert draft state.
//
// This check FAILED before those ops declared `page:` and passes after -- it is not a vacuous pass. Keep it: it is what makes adding a new inverse-only op a test failure instead of a permission hole.
check('every page pageForOp can emit is a real permission scope', () => {
    const { pageForOp } = require('../core/changeset');
    const { MANAGE_PAGE_SCOPES } = require('../utils/adminAccess');
    const emitted = [...new Set(ops.listOpTypes().map(t => pageForOp({ type: t })))].sort();
    const orphans = emitted.filter(p => !MANAGE_PAGE_SCOPES.includes(p));
    assert.deepStrictEqual(orphans, [], `pageForOp emits ${orphans.join(', ')} — no MANAGE_PAGE_SCOPES entry contains it, so hasManagePageAccess can never match a grant for it`);
    // Both directions of the season/draft split, named explicitly -- these two were wrong in OPPOSITE ways and a set-level check alone would not say which.
    assert.strictEqual(pageForOp({ type: 'season.restoreDraft' }), 'seasondraft', 'restoreDraft reverses a DRAFT discard, so it is gated on manage.seasondraft');
    assert.strictEqual(pageForOp({ type: 'season.restoreSnapshot' }), 'season', 'restoreSnapshot reverses a live-season wipe');
    assert.strictEqual(pageForOp({ type: 'patchnote.editSeason' }), 'patchnotes', 'the singular namespace must never reach ChangeLog.page again');
});

// A declared page and a registered action are two spellings of one fact, so registration refuses them when they disagree -- a boot-time throw beats a permission check that silently compares against nothing.
check('an op may not declare a page that contradicts its own action', () => {
    assert.throws(
        () => ops.registerEntity('conflict-probe', {
            'probe.mismatch': { page: 'calendar', action: 'draws:probe', validate: () => ({ ok: true }), preview: async () => ({}), apply: async () => ({ ok: true }), invert: () => ({}) }
        }),
        /declares page "calendar" but its actions live on draws/
    );
});

process.exit(failures ? 1 : 0);
