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

process.exit(failures ? 1 : 0);
