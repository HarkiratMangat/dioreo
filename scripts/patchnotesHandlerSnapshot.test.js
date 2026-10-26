// scripts/patchnotesHandlerSnapshot.test.js Written BEFORE the refactor, against the pre-refactor code, so it can prove the refactor changed nothing a user sees. Same technique as scripts/drawsHandlerSnapshot.test.js (feedback_snapshot_before_unclickable_refactor).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const manageCommand = require('../commands/manage');

const FIXTURE = path.join(__dirname, 'fixtures', 'patchnotes-modals.json');

const SAMPLE_ENTRY = {
    _id: '507f1f77bcf86cd799439011', title: 'Season 8', titleOverride: '', description: 'b: Fennec damage',
    releaseDate: new Date('2026-08-15T12:00:00.000Z'),
    images: ['https://example.com/1.png', 'https://example.com/2.png']
};

function capture() {
    return {
        dateInfo: manageCommand.buildPatchDateInfoModal(SAMPLE_ENTRY, 'America/Toronto').toJSON(),
        dateInfoBlank: manageCommand.buildPatchDateInfoModal(null, 'America/Toronto').toJSON(),
        urls1: manageCommand.buildPatchUrlsModal(1, SAMPLE_ENTRY).toJSON(),
        urls2: manageCommand.buildPatchUrlsModal(2, SAMPLE_ENTRY).toJSON(),
        addSeason: manageCommand.buildPatchAddSeasonModal().toJSON(),
        editSeason: manageCommand.buildPatchEditSeasonModal(SAMPLE_ENTRY, 'America/Toronto').toJSON()
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
    'a /manage patch notes modal changed shape — the refactor was supposed to be invisible');
console.log('  ✓ every patch notes modal is byte-identical to the pre-refactor fixture');
