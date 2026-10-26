// scripts/undoRetired.test.js Two properties, and the second is the one that matters long-term: every mutating /manage action must resolve to an op, so a NEW action cannot be added without core behaviour behind it.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ACTIONS_BY_PAGE } = require('../utils/manageActions');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('registerUndo is gone from the entire handler tree', () => {
    const dir = path.join(__dirname, '..', 'handlers', 'manage');
    const hits = fs.readdirSync(dir)
        .filter(f => f.endsWith('.js'))
        .filter(f => fs.readFileSync(path.join(dir, f), 'utf8').includes('registerUndo'));
    assert.deepStrictEqual(hits, [], `registerUndo still used in: ${hits.join(', ')}`);
});

check('EVERY mutating action on EVERY page resolves to an op', () => {
    const readOnly = new Set(['formatguide', 'exportnew', 'exportreturning', 'export',
                              'exportall', 'exportupto5', 'exportcategory']);
    const missing = [];
    for (const [page, list] of Object.entries(ACTIONS_BY_PAGE)) {
        for (const a of list) {
            if (readOnly.has(a.id)) continue;
            if (!ops.opTypeForAction(page, a.id)) missing.push(`${page}:${a.id}`);
        }
    }
    assert.deepStrictEqual(missing, [], `actions with no op behind them: ${missing.join(', ')}`);
});

process.exit(failures ? 1 : 0);
