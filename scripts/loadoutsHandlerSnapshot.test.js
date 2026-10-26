// scripts/loadoutsHandlerSnapshot.test.js Written BEFORE the refactor, against the pre-refactor code, so it can prove the refactor changed nothing a user sees. Same technique as scripts/drawsHandlerSnapshot.test.js (feedback_snapshot_before_unclickable_refactor). Covers BOTH MP and DMZ -- they share every modal builder, differing only by the `mode` argument.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const manageCommand = require('../commands/manage');

const FIXTURE = path.join(__dirname, 'fixtures', 'loadouts-modals.json');

const SAMPLE_LOADOUT = {
    weaponName: 'FENNEC', buildName: 'CQB', attachments: ['Gauge-9 Mono', 'Crown-H3 Barrel'],
    imageKey: 'FENNEC-1', category: 'SMG', isMeta: true, categoryRank: 'best', dmzRangeRank: null, isToxic: false
};

function capture() {
    return {
        addMP: manageCommand.buildAddLoadoutModal('MP').toJSON(),
        addDMZ: manageCommand.buildAddLoadoutModal('DMZ').toJSON(),
        editMP: manageCommand.buildEditLoadoutModal(SAMPLE_LOADOUT, '507f1f77bcf86cd799439011').toJSON(),
        bulkAddMP: manageCommand.buildLoadoutsBulkAddModal('MP').toJSON(),
        bulkAddDMZ: manageCommand.buildLoadoutsBulkAddModal('DMZ').toJSON(),
        bulkRemoveMP: manageCommand.buildLoadoutsBulkRemoveModal('MP').toJSON(),
        bulkRemoveDMZ: manageCommand.buildLoadoutsBulkRemoveModal('DMZ').toJSON(),
        export5MP: manageCommand.buildLoadoutsExportUpTo5Modal('MP').toJSON(),
        exportCategoryMP: manageCommand.buildLoadoutsExportCategoryModal('MP').toJSON(),
        exportCategoryDMZ: manageCommand.buildLoadoutsExportCategoryModal('DMZ').toJSON(),
        searchEditMP: manageCommand.buildSearchModal('loadouts_mp', 'edit').toJSON(),
        searchDeleteDMZ: manageCommand.buildSearchModal('loadouts_dmz', 'delete').toJSON()
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
    'a /manage loadouts modal changed shape — the refactor was supposed to be invisible');
console.log('  ✓ every loadouts modal (MP + DMZ) is byte-identical to the pre-refactor fixture');
