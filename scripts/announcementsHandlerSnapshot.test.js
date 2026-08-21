// scripts/announcementsHandlerSnapshot.test.js Written BEFORE the refactor, against the pre-refactor code, so it can prove the refactor changed nothing a user sees. Same technique as scripts/drawsHandlerSnapshot.test.js (feedback_snapshot_before_unclickable_refactor).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const manageCommand = require('../commands/manage');

const FIXTURE = path.join(__dirname, 'fixtures', 'announcements-modals.json');

const SAMPLE_ANNOUNCEMENT = { _id: '507f1f77bcf86cd799439011', text: 'Hello world', expiresAt: new Date('2026-09-01T00:00:00.000Z') };

function capture() {
    return {
        post: manageCommand.buildAnnouncementModal(null).toJSON(),
        edit: manageCommand.buildAnnouncementModal(SAMPLE_ANNOUNCEMENT).toJSON()
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
    'a /manage announcement modal changed shape — the refactor was supposed to be invisible');
console.log('  ✓ every announcement modal is byte-identical to the pre-refactor fixture');
