// scripts/portalArmoryBulk.test.js — does the paste preview say what was actually lost?
//
// 🔴 THE SURFACE THIS CHECKS DID NOT EXIST UNTIL 2026-08-26. loadout.bulkAdd and loadout.bulkReplace were declared, tiered, permissioned and unreachable — the whole-registry version of that check now lives in scripts/portalOpsReach.test.js. What is here is the other half: a preview that tells the truth about a paste, which matters because the thing it stages upserts in place and the reader's only chance to see what will happen is before they press the button.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let failures = 0;
const say = console.log.bind(console);
function check(name, fn) {
    try { fn(); say(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

say('portalArmoryBulk — does the paste preview say what was actually lost?');

const ROOT = path.join(__dirname, '..');
const { bulkPasteSummary, armoryExportQuery } = require('../portal/ui/armory.logic');

// ── THE PASTE PREVIEW ─────────────────────────────────────────────────────────────────────────
//
// 🔴 RUN AGAINST THE REAL PARSER, NOT A FIXTURE OF WHAT I THINK IT DOES. The whole decomposition rests on one claim about utils/adminParser.js's control flow — that a rejected block pushes an error and stops, while an unrecognised badge token pushes an error and keeps going. A fixture asserting that would agree with itself forever; this asserts it against parseBulkLoadoutList on text built to produce one of each.
const { parseBulkLoadoutList } = require('../utils/adminParser');

const CLEAN = 'AK117 | AR\nBuild: Aggressive Flex\n- Monolithic Suppressor\n- No Stock';
const WARNS = 'Fennec | SMG\nBuild: Close Quarters\nBadges: meta, wobble\n- Muzzle Brake';
const REJECT_HEADER = 'MissingCategory\n- Muzzle Brake';
const REJECT_NOATTS = 'KRM 262 | SHOTGUN\nBuild: Slug';

check('the real parser splits into rejects and warnings exactly the way the summary assumes', () => {
    const text = [CLEAN, WARNS, REJECT_HEADER, REJECT_NOATTS].join('\n\n');
    const { parsed, errors } = parseBulkLoadoutList(text);
    assert.strictEqual(parsed.length, 2, 'the two readable blocks must parse');
    assert.strictEqual(errors.length, 3, 'two rejections plus one badge warning');
    const sum = bulkPasteSummary({ blocks: 4, rows: parsed.map((p) => ({ ...p, existing: false })), errors });
    assert.strictEqual(sum.understood, 2);
    assert.strictEqual(sum.rejected, 2, 'a rejected block is one the parser dropped, not one that produced an error');
    assert.strictEqual(sum.warnings, 1, 'the badge token saved the build and still deserves saying');
    assert.strictEqual(sum.creates, 2);
    assert.strictEqual(sum.updates, 0);
});

check('THE DECOMPOSITION CAN FAIL: counting the error array as rejections overstates the damage', () => {
    const { parsed, errors } = parseBulkLoadoutList([CLEAN, WARNS, REJECT_HEADER].join('\n\n'));
    // The naive reading — one error means one lost build — reports three losses over a paste that lost one.
    assert.notStrictEqual(errors.length, 3 - parsed.length,
        'this falsifier is vacuous unless the error count and the true rejection count actually differ here');
    assert.strictEqual(bulkPasteSummary({ blocks: 3, rows: parsed, errors }).rejected, 1);
});

check('an update is an update: a block matching an existing build is not counted as new', () => {
    const sum = bulkPasteSummary({ blocks: 2, rows: [{ existing: true }, { existing: false }], errors: [] });
    assert.strictEqual(sum.updates, 1);
    assert.strictEqual(sum.creates, 1);
    assert.strictEqual(sum.canStage, true);
});

check('nothing parsed means nothing to stage', () => {
    const { parsed, errors } = parseBulkLoadoutList(REJECT_HEADER);
    assert.strictEqual(parsed.length, 0);
    const sum = bulkPasteSummary({ blocks: 1, rows: parsed, errors });
    assert.strictEqual(sum.canStage, false);
    assert.strictEqual(sum.rejected, 1);
});

// ⚠️ SELECTION STAYS FIRST because the Manifest's own "Export selection" has always sent ids, and the route reads ids before mode. Reordering either side silently changes what an existing button exports.
check('the export query keeps selection ahead of the two new scopes', () => {
    assert.strictEqual(armoryExportQuery({ scope: 'selection', ids: ['a', 'b'], mode: 'MP' }), 'ids=a,b');
    assert.strictEqual(armoryExportQuery({ scope: 'category', mode: 'DMZ', category: 'SMG' }), 'mode=DMZ&category=SMG');
    assert.strictEqual(armoryExportQuery({ scope: 'mode', mode: 'MP' }), 'mode=MP');
    // A category scope with no category asked for every build of that mode rather than none, which is the safe direction and the one the route already handles.
    assert.strictEqual(armoryExportQuery({ scope: 'category', mode: 'MP', category: '' }), 'mode=MP');
});

check('the route the Bulk view calls is the route the server registers', () => {
    const api = fs.readFileSync(path.join(ROOT, 'portal', 'api', 'bulk.js'), 'utf8');
    const ui = fs.readFileSync(path.join(ROOT, 'portal', 'ui', 'armory.js'), 'utf8');
    assert.ok(ui.includes("'/api/parse-bulk/loadout'"), 'the Bulk view no longer calls the loadout parse route');
    assert.ok(api.includes(String.raw`/^\/api\/parse-bulk\/loadout$/`), 'portal/api/bulk.js no longer registers /api/parse-bulk/loadout');
    // ⚠️ The generic /api/parse-bulk route is anchored with $, which is the only reason the loadout path does not fall into it and get parsed as a draw list.
    assert.ok(api.includes(String.raw`/^\/api\/parse-bulk$/`), 'the generic parse route lost its end anchor, so /api/parse-bulk/loadout now matches it first');
});

say(failures ? `\n✗ ${failures} failed` : '\n✅ portalArmoryBulk: the paste preview counts what was actually lost, and the export keeps its scopes straight');
process.exit(failures ? 1 : 0);
