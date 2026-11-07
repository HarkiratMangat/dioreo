// The build audit's checks (scripts/auditLoadouts.js), against a handful of builds whose findings are known.
const assert = require('assert');
const { auditBuilds } = require('./auditLoadouts');
const b = (o) => ({ weaponKey: 'bal-27', weaponName: 'BAL-27', mode: 'MP', category: 'AR', imageKey: 'BAL-27-X', attachmentSlots: [], variants: [], ...o });
const builds = [
    b({ buildName: 'Build 1', shareCode: '1C2C4A8A9B', attachments: ['A', 'B', 'C', 'D', 'E'] }),
    b({ buildName: 'Build 2', shareCode: '1C2C4A8A9B', attachments: ['A', 'B', 'C', 'D', 'F'] }),
    b({ buildName: 'Build 4', shareCode: '1C2C4A8A9', attachments: ['A', 'B', 'C', 'D', 'E', 'G'], category: 'SMG' }),
    b({ buildName: 'Ranked', shareCode: '', attachments: ['Z'], isAss: true, isMeta: true }),
];
const f = auditBuilds(builds, { knownAttachment: a => a !== 'Z' });
const has = (kind, build, re) => f.some(x => x.kind === kind && String(x.build) === String(build) && (!re || re.test(x.detail)));
assert.ok(has('duplicate', '2', /same code as 1/), 'a repeated code');
assert.ok(has('duplicate', '4', /same attachments as 1/) === false, 'a different list is not a duplicate');
assert.ok(has('attachments', '4', /6 attachments/), 'over the MP equip cap');
assert.ok(has('code', '?', /no gunsmith code/), 'an MP build with no code');
assert.ok(has('name', 'Ranked'), 'a legacy name');
assert.ok(f.some(x => x.kind === 'numbering' && /gap/.test(x.detail)), 'Build 3 is missing');
assert.ok(f.some(x => x.kind === 'category'), 'AR and SMG on one weapon');
assert.ok(has('badges', '?'), 'Ass with Meta');
assert.ok(has('catalogue', '?', /Z/), 'a name the catalogue lacks');
const clean = auditBuilds([b({ buildName: 'Build 1', shareCode: '1C2C4A8A9B', attachments: ['A'] })]);
assert.deepStrictEqual(clean, [], 'a clean build has no findings');
console.log('All build-audit checks passed.');
