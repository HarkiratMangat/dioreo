// scripts/inclusiveEnd.test.js -- a typed end DAY is inclusive (2026-11-11 21:58 EST): "11/12 - 12/9" ends 12/10 00:00 UTC, as the game's own countdown showed for Super Attack of the Undead 3.0. Every box and export writes the listed day back, so nothing moves on an untouched save. utils/adminParser.js parseAdminEndDate's header has the rule.
const assert = require('assert');
const A = require('../utils/adminParser');
const iso = (d) => new Date(d).toISOString();
let failures = 0;
const check = (name, fn) => { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message.split('\n').slice(0, 4).join('\n      ')}`); } };

check('the official calendar line ends at 00:00 UTC the day after its listed end', () => {
    const [e] = A.parseBulkEvents('e 11/12 - 12/9 | Super Attack of the Undead 3.0');
    assert.ok(iso(e.endDate).endsWith('-12-10T00:00:00.000Z'), iso(e.endDate));
    assert.ok(iso(A.parseAdminEndDate('December 9, 2026')) === '2026-12-10T00:00:00.000Z');
    assert.strictEqual(iso(A.parseAdminDateRange('Nov 12, 2026 - Dec 9, 2026').end), '2026-12-10T00:00:00.000Z');
});
check('a countdown, a relative end, a typed time and an ISO day are read exactly as before', () => {
    const now = new Date('2026-11-12T01:22:00Z');
    assert.strictEqual(iso(A.parseAdminEndDate('27d 22h', now)), '2026-12-10T00:00:00.000Z', 'the game countdown is the exact end');
    assert.strictEqual(iso(A.parseAdminEndDate('2026-12-10')), '2026-12-10T00:00:00.000Z', 'an ISO day (the portal) is as it is');
    assert.strictEqual(iso(A.parseAdminEndDate('Dec 9 2026 7pm')), iso(A.parseAdminDate('Dec 9 2026 7pm')), 'a typed time keeps its old reading (the start box\'s)');
    const rel = A.parseAdminEndDate('in 3 days');
    assert.ok(rel && !rel.getUTCHours(), 'a relative end is still a midnight');
    assert.strictEqual(rel.getTime(), A.parseAdminDate('in 3 days').getTime(), 'and not shifted');
});
check('export then paste back gives the same rows (calendar)', () => {
    const rows = [
        { title: 'A', date: new Date('2026-11-12T00:00:00Z'), endDate: new Date('2026-12-10T00:00:00Z'), isOngoing: false, category: 'event' },
        { title: 'B', date: new Date('2026-11-12T00:00:00Z'), endDate: null, isOngoing: true, category: 'playlist' },
        { title: 'C', date: new Date('2026-11-12T00:00:00Z'), endDate: null, isOngoing: false, category: 'draw' },
        { title: 'D', date: new Date('2026-11-12T00:00:00Z'), endDate: new Date('2026-11-25T00:00:00Z'), isOngoing: false, category: 'event', isDoubleCP: true },
    ];
    const text = A.formatCalendarAsBulkText(rows);
    assert.ok(text.includes('11/12 - 12/9 | A'), text);
    const back = A.parseBulkEvents(text);
    for (const [i, r] of rows.entries()) {
        assert.strictEqual(back[i].title, r.title);
        assert.strictEqual(back[i].endDate ? iso(back[i].endDate).slice(5, 10) : null, r.endDate ? iso(r.endDate).slice(5, 10) : null, r.title);
        assert.strictEqual(back[i].isOngoing, r.isOngoing, r.title);
    }
});
check('export then paste back gives the same draw dates, and the boxes show the listed day', () => {
    const draw = { title: 'Row Draw', date: new Date('2026-11-12T00:00:00Z'), items: [{ tier: 'legendary', name: 'A - B' }], thumbnailUrl: 'https://x.test/y.jpg', priceType: '' };
    const text = A.formatDrawsAsBulkText([draw], () => ({ endDate: new Date('2026-12-10T00:00:00Z') }));
    assert.ok(text.includes('November 12, 2026 - December 9, 2026'), text);
    const [p] = A.parseBulkDrawList(text);
    assert.strictEqual(iso(p.endDate), '2026-12-10T00:00:00.000Z');
    assert.strictEqual(A.formatAdminEndDate(new Date('2026-12-10T00:00:00Z')), 'December 9, 2026');
    assert.strictEqual(iso(A.parseAdminEndDate(A.formatAdminEndDate(new Date('2026-12-10T00:00:00Z')))), '2026-12-10T00:00:00.000Z', 'a box opened and saved untouched keeps its end');
});
check('Quick Add reads an end day the same way, and a countdown or "in N days" exactly', () => {
    const qa = require('../utils/quickAdd');
    const opts = { now: new Date('2026-11-12T01:00:00Z') };
    assert.strictEqual(iso(qa.parseQuickLine('x, ends Dec 9', opts).end.date), '2026-12-10T00:00:00.000Z');
    assert.strictEqual(iso(qa.parseQuickLine('x, ends 27d 22h', opts).end.date), '2026-12-10T00:00:00.000Z');
    const rel = qa.parseQuickLine('x, ends in 3 days', opts).end;
    assert.ok(rel && rel.relative && iso(rel.date).startsWith('2026-11-1'), JSON.stringify(rel));
});
if (failures) { console.error(`\n${failures} check(s) FAILED.`); process.exit(1); }
console.log('\nAll inclusive end checks passed.');
