// scripts/calendarHandlerSnapshot.test.js Written BEFORE the refactor, against the pre-refactor code, so it can prove the refactor changed nothing a user sees. Same technique as scripts/drawsHandlerSnapshot.test.js (feedback_snapshot_before_unclickable_refactor).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const manageCommand = require('../commands/manage');

const FIXTURE = path.join(__dirname, 'fixtures', 'calendar-modals.json');

const SAMPLE_EVENT = {
    title: 'Nuketown Playlist', date: new Date('2026-08-01T00:00:00.000Z'), isOngoing: false,
    endDate: new Date('2026-08-15T00:00:00.000Z'), category: 'playlist', isDoubleCP: true
};
const SAMPLE_DOC = {
    drawsBannerUrl: 'https://example.com/draws.png',
    eventsBannerUrl: 'https://example.com/events.png',
    playlistsBannerUrl: ''
};

function capture() {
    return {
        add: manageCommand.buildCalendarAddModal().toJSON(),
        bulkAdd: manageCommand.buildCalendarBulkModal('add').toJSON(),
        bulkReplace: manageCommand.buildCalendarBulkModal('replace').toJSON(),
        bulkRemove: manageCommand.buildCalendarBulkRemoveModal().toJSON(),
        banners: manageCommand.buildCalendarBannersModal(SAMPLE_DOC).toJSON(),
        edit: manageCommand.buildEditCalendarModal(SAMPLE_EVENT, '507f1f77bcf86cd799439011').toJSON(),
        searchEdit: manageCommand.buildSearchModal('calendar', 'edit').toJSON(),
        searchDelete: manageCommand.buildSearchModal('calendar', 'delete').toJSON()
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
    'a /manage calendar modal changed shape — the refactor was supposed to be invisible');
console.log('  ✓ every calendar modal is byte-identical to the pre-refactor fixture');
