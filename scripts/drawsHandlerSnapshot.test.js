// scripts/drawsHandlerSnapshot.test.js
// Written BEFORE the refactor, against the pre-refactor code, so it can prove the refactor changed
// nothing a user sees. This is the technique from feedback_snapshot_before_unclickable_refactor:
// when click-testing is impractical, a deepStrictEqual against a captured fixture is the substitute.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const manageCommand = require('../commands/manage');

const FIXTURE = path.join(__dirname, 'fixtures', 'draws-modals.json');

function capture() {
    return {
        addNew: manageCommand.buildAddDrawModal('new').toJSON(),
        addReturning: manageCommand.buildAddDrawModal('returning').toJSON(),
        bulkAdd: manageCommand.buildBulkBothDrawsModal('add').toJSON(),
        bulkReplace: manageCommand.buildBulkBothDrawsModal('replace').toJSON(),
        bulkRemove: manageCommand.buildBulkRemoveDrawsModal('either').toJSON(),
        searchEdit: manageCommand.buildSearchModal('draws', 'edit').toJSON(),
        searchDelete: manageCommand.buildSearchModal('draws', 'delete').toJSON()
    };
}

if (process.argv.includes('--write')) {
    fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
    fs.writeFileSync(FIXTURE, JSON.stringify(capture(), null, 2));
    console.log('  · fixture written —', FIXTURE);
    process.exit(0);
}

const expected = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
assert.deepStrictEqual(capture(), expected,
    'a /manage draws modal changed shape — the refactor was supposed to be invisible');
console.log('  ✓ every draws modal is byte-identical to the pre-refactor fixture');
