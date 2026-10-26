// scripts/timezoneSearch.test.js -- utils/timezoneData.js reaches every zone the runtime knows (Harkirat, 2026-10-24 21:15 EDT: "Yes extend, as well to /timestamp"): the 41 hand-made zones plus Intl's own list, searchable by city, and by country where a hint exists; exact names rank first; the common zones run west to east (21:18 EDT: "better organize the list of time zones so they're not a scattered order"); /timestamp resolves typed text the same way.
const assert = require('assert');
const T = require('../utils/timezoneData');
let passed = 0, failed = 0;
const t = (name, fn) => { try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name}\n      ${e.message}`); } };

t('every clock rule the runtime knows has a zone in the list', () => {
    const rule = tz => ['2026-01-15', '2026-07-15'].map(d => new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(new Date(d)).find(x => x.type === 'timeZoneName').value).join('/');
    const all = new Set(Intl.supportedValuesOf('timeZone').map(rule));
    const ours = new Set(T.EVERY_TIMEZONE.map(z => rule(z.tz)));
    assert.deepStrictEqual([...all].filter(r => !ours.has(r)), []);
});
t('the places that had no zone are found by city and by country, exact names first', () => {
    for (const [q, tz] of [['kathmandu', 'Asia/Katmandu'], ['nepal', 'Asia/Katmandu'], ['tehran', 'Asia/Tehran'], ['iran', 'Asia/Tehran'], ['kabul', 'Asia/Kabul'], ['yangon', 'Asia/Rangoon'], ['tonga', 'Pacific/Tongatapu'], ['chatham', 'Pacific/Chatham'], ['kyiv', 'Europe/Kiev']])
        assert.strictEqual(T.searchTimezones(q, 1)[0]?.value, tz, q);
});
t('the 41 hand-made zones keep their names, and an old CLDR id is not listed twice', () => {
    assert.strictEqual(T.searchTimezones('tokyo', 1)[0].value, 'Asia/Tokyo');
    assert.ok(!T.EVERY_TIMEZONE.some(z => z.tz === 'Asia/Calcutta'), 'Asia/Calcutta is Asia/Kolkata');
    assert.strictEqual(T.timezoneBaseLabel('Asia/Katmandu'), 'Kathmandu (Asia)');
});
t('the common zones run west to east, each label led by its UTC offset', () => {
    const offsets = T.quickZoneOptions().map(o => T.utcOffsetMinutes(o.value));
    assert.deepStrictEqual(offsets, [...offsets].sort((a, b) => a - b));
    assert.ok(T.quickZoneOptions().every(o => /^\(UTC[+−]\d{1,2}(:\d\d)?\) /.test(o.label)), 'every label starts with (UTC±H)');
});
t('resolveTimezone: an IANA id as is, a typed name by search, nonsense as null', () => {
    assert.strictEqual(T.resolveTimezone('Asia/Kolkata'), 'Asia/Kolkata');
    assert.strictEqual(T.resolveTimezone('nepal'), 'Asia/Katmandu');
    assert.strictEqual(T.resolveTimezone('zzqx'), null);
});

console.log(`\n${failed ? 'FAILED' : 'all passed'}: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
