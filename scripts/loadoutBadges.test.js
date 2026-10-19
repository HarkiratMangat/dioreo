// scripts/loadoutBadges.test.js
//
// The badge set as of 2026-10-19: Ass and Capable, Top 4 retired, the Rank Mode family, and every badge per build (Harkirat, 15:59 EDT: "move all badge types to per build instead per weapon"). Pure checks: the parser, the export round trip, the card lines and the op's validator. No database.
const assert = require('assert');
const { parseLoadoutBadges, loadoutBadgeTokens, parseBulkLoadoutList, formatLoadoutsAsBulkText } = require('../utils/adminParser');
const { buildLoadoutCardBody } = require('../utils/loadoutRender');
// buildBadgesLine is private to the card; read the badge line off the card body's title block.
const buildBadgesLine = (b) => buildLoadoutCardBody({ weaponName: 'X', attachments: [], lastUpdated: new Date(0), ...b })[0].content;
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('rank modes parse in the fixed order, aliases included', () => {
    const r = parseLoadoutBadges('control, snd, hp, ctrl, sd', 'MP');
    assert.deepStrictEqual(r.rankModes, ['HP', 'S&D', 'Control']);
    assert.deepStrictEqual(r.unrecognized, []);
});

check('a DMZ build drops rank modes with a warning, never as unrecognized', () => {
    const r = parseLoadoutBadges('meta, hp', 'DMZ');
    assert.deepStrictEqual(r.rankModes, []);
    assert.strictEqual(r.isMeta, true);
    assert.strictEqual(r.unrecognized.length, 0);
    assert.ok(r.warnings.some(w => /rank mode/.test(w)));
});

check('top4 reads as top5 and says so, in a tier and in a DMZ range', () => {
    const a = parseLoadoutBadges('top4');
    assert.strictEqual(a.categoryRank, 'top5');
    assert.ok(a.warnings.some(w => /top4/.test(w)));
    assert.strictEqual(parseLoadoutBadges('top4close').dmzRangeRank, 'top5-close');
});

check('capable is a tier, and a capable range reads with or without a hyphen', () => {
    assert.strictEqual(parseLoadoutBadges('capable').categoryRank, 'capable');
    assert.strictEqual(parseLoadoutBadges('capableclose').dmzRangeRank, 'capable-close');
    assert.strictEqual(parseLoadoutBadges('best-midlong').dmzRangeRank, 'best-midlong');
});

check('ass is dropped beside meta or a tier, and kept beside toxic', () => {
    const withMeta = parseLoadoutBadges('ass, meta');
    assert.strictEqual(withMeta.isAss, false);
    assert.strictEqual(withMeta.isMeta, true);
    assert.ok(withMeta.warnings.some(w => /ass/.test(w)));
    assert.strictEqual(parseLoadoutBadges('ass, top3').isAss, false);
    const withToxic = parseLoadoutBadges('ass, toxic');
    assert.strictEqual(withToxic.isAss, true);
    assert.strictEqual(withToxic.isToxic, true);
    assert.deepStrictEqual(withToxic.warnings, []);
});

check('every badge round-trips through the bulk export and back', () => {
    const build = { weaponName: 'AK117', category: 'AR', mode: 'MP', buildName: 'B1', imageKey: 'AK117-1', attachments: ['a'],
                    isMeta: false, isToxic: true, isAss: true, categoryRank: null, dmzRangeRank: null, rankModes: ['S&D', 'HP'] };
    const { parsed, errors } = parseBulkLoadoutList(formatLoadoutsAsBulkText([build]));
    assert.deepStrictEqual(errors, []);
    assert.strictEqual(parsed[0].isAss, true);
    assert.strictEqual(parsed[0].isToxic, true);
    assert.deepStrictEqual(parsed[0].rankModes, ['HP', 'S&D']);
    assert.deepStrictEqual(loadoutBadgeTokens({ ...build, mode: 'DMZ' }).includes('hp'), false, 'a DMZ build never writes a rank mode back');
});

check('the card names the Capable tier with its category, and Ass', () => {
    const line = buildBadgesLine({ mode: 'MP', category: 'AR', categoryRank: 'capable', isToxic: true });
    assert.ok(/Capable AR/.test(line), line);
    assert.ok(/Ass/.test(buildBadgesLine({ mode: 'MP', category: 'AR', isAss: true })));
    assert.ok(/Capable Close Range/.test(buildBadgesLine({ mode: 'DMZ', dmzRangeRank: 'capable-close' })));
});

check('the Recommended Rank Mode line renders for MP, bare words when the emoji is not on the app, and never for DMZ', () => {
    const base = { weaponName: 'AK117', category: 'AR', attachments: ['a'], lastUpdated: new Date(0) };
    const mp = JSON.stringify(buildLoadoutCardBody({ ...base, mode: 'MP', rankModes: ['S&D', 'HP'] }));
    assert.ok(mp.includes('**Recommended Rank Mode:** HP | S&D'), mp);
    const dmz = JSON.stringify(buildLoadoutCardBody({ ...base, mode: 'DMZ', rankModes: ['HP'] }));
    assert.ok(!dmz.includes('Recommended Rank Mode'));
});

const validate = (payload) => ops.resolveOp('loadout.add').validate({ type: 'loadout.add', payload: { weaponName: 'AK117', mode: 'MP', category: 'AR', ...payload } });

check('the op refuses Ass beside Meta or a tier, from any surface', () => {
    assert.strictEqual(validate({ isAss: true, isMeta: true }).ok, false);
    assert.strictEqual(validate({ isAss: true, categoryRank: 'best' }).ok, false);
    assert.strictEqual(validate({ isAss: true, isToxic: true }).ok, true);
});

check('the op omits isAss and rankModes when the caller did not send them, so an older surface cannot clear them', () => {
    const p = validate({}).normalized.payload;
    assert.ok(!('isAss' in p) && !('rankModes' in p), JSON.stringify(p));
    assert.deepStrictEqual(validate({ rankModes: ['Control', 'HP', 'Bogus'] }).normalized.payload.rankModes, ['HP', 'Control']);
    assert.deepStrictEqual(validate({ mode: 'DMZ', rankModes: ['HP'] }).normalized.payload.rankModes, []);
});

check('a bulk paste on the DMZ page moves a bare tier to dmzRangeRank and drops rank modes with a note', () => {
    const text = 'FENNEC | SMG\nBadges: best, hp\n- a';
    const r = ops.resolveOp('loadout.bulkAdd').validate({ type: 'loadout.bulkAdd', target: { mode: 'DMZ' }, payload: { text } });
    const p = r.normalized.payload.parsed[0];
    assert.strictEqual(p.dmzRangeRank, 'best');
    assert.strictEqual(p.categoryRank, null);
    assert.deepStrictEqual(p.rankModes, []);
    assert.ok(r.normalized.payload.parseErrors.some(e => /MP only/.test(e)));
});

check('no op copies badges onto a sibling build any more', () => {
    const src = require('fs').readFileSync(require.resolve('../core/ops/loadouts.js'), 'utf8');
    assert.ok(!/propagateBadges\(|updateMany\(/.test(src), 'core/ops/loadouts.js must not write to builds it was not asked about');
    const ab = require('fs').readFileSync(require.resolve('../utils/autobuildPipeline.js'), 'utf8');
    assert.ok(!/updateMany\(/.test(ab), '/autobuild must not copy its badges to the weapon\'s other builds');
});

if (failures) { console.error(`\n${failures} badge check(s) failed.`); process.exit(1); }
console.log('\nloadoutBadges: all checks passed.');
process.exit(0);
