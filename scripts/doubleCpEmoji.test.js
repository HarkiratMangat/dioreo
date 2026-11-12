// scripts/doubleCpEmoji.test.js -- a Double CP row wears the 2X CP emoji on /calendar and /calendar's Today page (2026-11-11 22:03 EST, Harkirat: "use our 2x cp emoji as well. and add the emoji beside the calendar event as well"). The emoji is read at render time, so each bot shows its own copy.
const assert = require('assert');
const emojis = require('../utils/emojiMap');
const cal = require('../commands/calendar');
assert.ok(emojis.doubleCp, 'the map has the 2X CP emoji');
const doc = { bpEnd: new Date('2027-01-01T00:00:00Z'), calendar: [], newDraws: [], returningDraws: [] };
const row = (isDoubleCP) => ({ title: '2X COD Points Event', date: new Date('2026-11-10T00:00:00Z'), endDate: new Date('2026-11-20T00:00:00Z'), category: 'event', isDoubleCP });
const now = Date.parse('2026-11-12T00:00:00Z');
assert.ok(cal.buildEntryLine(row(true), doc, now).includes(emojis.doubleCp), 'a Double CP row shows the emoji');
assert.ok(!cal.buildEntryLine(row(false), doc, now).includes(emojis.doubleCp), 'any other row does not');
console.log('  ✓ a Double CP row wears the 2X CP emoji on /calendar; any other row does not');
