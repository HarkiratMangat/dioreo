// scripts/manageEditModals.test.js the Edit Draw pop-up opens on a draw that has no date or no items (2026-11-04 00:45 EST, /manage audit). Both used to throw before the pop-up showed, so the tool that fixes a broken record crashed on it. Pure, no database.
const assert = require('assert');
const manage = require('../commands/manage');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

const valueOf = (modal, id) => {
    const json = modal.toJSON();
    const label = json.components.find(c => c.component?.custom_id === id);
    return label?.component?.value;
};

check('Edit Draw opens on a draw with no date, and leaves the date box empty to be filled in', () => {
    const modal = manage.buildEditDrawModal({ title: 'T', items: [{ tier: 'legendary', name: 'A' }] }, 'abc', 'new');
    assert.strictEqual(valueOf(modal, 'date'), '', 'a missing date must read as an empty box, not throw');
});

check('Edit Draw opens on a draw with no items, and leaves the items box empty', () => {
    const modal = manage.buildEditDrawModal({ title: 'T', date: new Date('2026-09-10') }, 'abc', 'new');
    assert.ok(!valueOf(modal, 'items'), 'no items must read as an empty box');
});

check('Edit Draw still pre-fills a normal draw (the falsifier: the guard did not blank real values)', () => {
    const modal = manage.buildEditDrawModal({ title: 'T', date: new Date('2026-09-10'), items: [{ tier: 'legendary', name: 'Rin Yoshida - Herrscher Of Thunder' }] }, 'abc', 'new');
    assert.strictEqual(valueOf(modal, 'date'), 'September 10, 2026');
    assert.strictEqual(valueOf(modal, 'items'), 'l Rin Yoshida - Herrscher Of Thunder');
});

check('Edit Draw shows the end date from the draw\'s calendar row, as the season box does', () => {
    const row = { endDate: new Date('2026-11-12T00:00:00Z') };
    const modal = manage.buildEditDrawModal({ title: 'T', date: new Date('2026-09-10T00:00:00Z'), items: [{ tier: 'legendary', name: 'A' }] }, 'abc', 'new', row);
    assert.strictEqual(valueOf(modal, 'date'), 'September 10, 2026 - November 12, 2026');
});

process.exit(failures ? 1 : 0);
