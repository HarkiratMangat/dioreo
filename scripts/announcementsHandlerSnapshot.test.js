// scripts/announcementsHandlerSnapshot.test.js Written BEFORE the refactor, against the pre-refactor code, so it can prove the refactor changed nothing a user sees. Same technique as scripts/drawsHandlerSnapshot.test.js (feedback_snapshot_before_unclickable_refactor).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const manageCommand = require('../commands/manage');
const { expiryToInputValue } = require('../utils/announcement');

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
// The Edit modal's expiry field pre-fills via expiryToInputValue(expiresAt), computed relative to `new Date()` AT TEST-RUN TIME (commands/manage.js's buildAnnouncementModal) -- a frozen fixture value for just this one field silently drifts by one every day real time crosses a day boundary past whenever the fixture was last regenerated. Every other field is a genuine snapshot (labels, custom_ids, the post variant) and stays compared against the frozen fixture; only this one relative-date value is recomputed fresh, matching what the real handler would actually produce right now. Found live in CI 2026-08-22 (docs/db-deferred-list.md's entry for this, now resolved).
expected.edit.components[1].components[0].value = expiryToInputValue(SAMPLE_ANNOUNCEMENT.expiresAt);
assert.deepStrictEqual(capture(), expected,
    'a /manage announcement modal changed shape — the refactor was supposed to be invisible');
console.log('  ✓ every announcement modal is byte-identical to the pre-refactor fixture (expiry field compared live, not frozen)');
