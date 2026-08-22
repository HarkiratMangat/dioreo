// scripts/drawOps.test.js validate() and invert() are PURE — no DB, no network. apply() is covered by Task 7's integration test.
const assert = require('assert');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('draw.add rejects a draw with no title', () => {
    const r = ops.resolveOp('draw.add').validate({ type: 'draw.add', payload: { title: '', category: 'new' } });
    assert.strictEqual(r.ok, false);
    assert.ok(r.errors.some(e => /title/i.test(e)), `expected a title error, got ${JSON.stringify(r.errors)}`);
});

check('draw.add normalizes the title to title case', () => {
    const r = ops.resolveOp('draw.add').validate({
        type: 'draw.add', payload: { title: 'iron wolf — legendary', category: 'new', items: [] }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    assert.strictEqual(r.normalized.payload.title, 'Iron Wolf — Legendary');
});

check('draw.add inverts to draw.delete naming the created element', () => {
    const inv = ops.resolveOp('draw.add').invert({
        action: 'add', model: 'SeasonalData',
        applied: { category: 'new', elementId: '65abc', title: 'Iron Wolf' }
    });
    assert.strictEqual(inv.type, 'draw.delete');
    assert.strictEqual(inv.target.elementId, '65abc');
});

check('draw.bulkReplace inverts to a bulkReplace carrying the FULL prior set', () => {
    const prior = [{ title: 'A' }, { title: 'B' }, { title: 'C' }, { title: 'D' }];
    const inv = ops.resolveOp('draw.bulkReplace').invert({
        action: 'bulkReplace', applied: { category: 'new', replaced: prior, added: [{ title: 'Nightfall' }] }
    });
    assert.strictEqual(inv.type, 'draw.bulkReplace');
    assert.deepStrictEqual(inv.payload.parsed, prior,
        'the inverse of a replace must restore every element it destroyed, not just record the count');
});

// The next three checks pin defects found during Task 6 integration — parseBulkDrawList() (utils/adminParser.js) returns a FLAT array, never { newDraws, returningDraws }, and the real "Bulk Delete Draws" modal collects pasted TITLES, never element ids.
check('draw.bulkAdd requires a category, and validates a flat parsed array', () => {
    const noCategory = ops.resolveOp('draw.bulkAdd').validate({ type: 'draw.bulkAdd', payload: { text: 'x' } });
    assert.strictEqual(noCategory.ok, false, 'a bulk add with no category could not know which array to append to');

    const r = ops.resolveOp('draw.bulkAdd').validate({
        type: 'draw.bulkAdd', target: { category: 'new' },
        payload: { text: 'Iron Wolf, m Item 1, Aug 24' }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    assert.ok(Array.isArray(r.normalized.payload.parsed), 'parseBulkDrawList returns a flat array, not {newDraws,returningDraws}');
    assert.strictEqual(r.normalized.payload.parsed[0].title, 'Iron Wolf');
});

check('draw.bulkReplace requires a category too, for the same reason', () => {
    const r = ops.resolveOp('draw.bulkReplace').validate({ type: 'draw.bulkReplace', payload: { text: 'x' } });
    assert.strictEqual(r.ok, false, 'a replace with no category would not know which list to merge into');
});

check('draw.bulkDelete accepts pasted TITLES (the real UI), not just ids', () => {
    const r = ops.resolveOp('draw.bulkDelete').validate({
        type: 'draw.bulkDelete', payload: { titles: { newDraws: ['Iron Wolf'] } }
    });
    assert.strictEqual(r.ok, true, 'the modal collects titles the admin typed — an ids-only op could never be constructed from it');
});

// Real crash, reproduced live 2026-08-22 15:20 EDT: handlers/manage/draws.js's addDraw/editDraw pre-parse the modal's date string via parseAdminDate() BEFORE building the op payload (so commitSet always sees payload.date as a real Date instance, never the raw string) -- but validateOne() unconditionally re-ran payload.date through parseAdminDate() again, which calls dateStr.trim() and threw `TypeError: dateStr.trim is not a function` on a Date. Every single draw add/edit via /manage crashed uncaught (the router's crash net only logs, so the interaction just hung on "thinking..." forever -- exactly what Harkirat saw testing the dev bot). core/ops/calendar.js's validateEvent already had the right guard (isAlreadyDated) for this exact hazard; draws.js never got it.
check('draw.add validates successfully when payload.date already arrives as a real Date (the actual shape handlers/manage/draws.js sends)', () => {
    const r = ops.resolveOp('draw.add').validate({
        type: 'draw.add', payload: { title: 'Iron Wolf', category: 'new', date: new Date('2026-09-01'), items: [] }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
});

check('draw.edit validates successfully when payload.date already arrives as a real Date', () => {
    const r = ops.resolveOp('draw.edit').validate({
        type: 'draw.edit', target: { elementId: '65abc', category: 'new' },
        payload: { title: 'Iron Wolf', date: new Date('2026-09-01'), items: [] }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
});

check('every draw op declares a tier, and purge/bulkReplace are tier 3 and 2', () => {
    for (const t of ops.listOpTypes().filter(t => t.startsWith('draw.'))) {
        assert.ok([1, 2, 3].includes(ops.resolveOp(t).tier), `${t} has no tier`);
    }
    assert.strictEqual(ops.resolveOp('draw.purge').tier, 3);
    assert.strictEqual(ops.resolveOp('draw.bulkReplace').tier, 2);
    assert.strictEqual(ops.resolveOp('draw.add').tier, 1);
});

process.exit(failures ? 1 : 0);
