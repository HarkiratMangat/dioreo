// scripts/seasonHandlerSnapshot.test.js Written BEFORE the refactor, against the pre-refactor code, so it can prove the refactor changed nothing a user sees. Same technique as scripts/drawsHandlerSnapshot.test.js (feedback_snapshot_before_unclickable_refactor).
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const manageCommand = require('../commands/manage');

const FIXTURE = path.join(__dirname, 'fixtures', 'season-modals.json');

const SAMPLE_DOC = {
    currentSeasonTitle: 'Season 8', bpTitle: 'Battle Pass', rankTitle: 'Ranked Series', dmzTitle: 'DMZ Season',
    bpEnd: new Date('2026-09-04T00:00:00.000Z'), rankEnd: new Date('2026-09-04T00:00:00.000Z'), dmzEnd: null,
    bpEndTBD: false, rankEndTBD: false, dmzEndTBD: true,
    draft: { currentSeasonTitle: 'Season 9', bpTitle: 'Battle Pass', bpEnd: null,
              newDraws: [], returningDraws: [], calendar: [] }
};

function capture() {
    return {
        wipeSeason: manageCommand.buildWipeSeasonModal().toJSON(),
        titlesDeadlines: manageCommand.buildSeasonTitlesDeadlinesModal(SAMPLE_DOC).toJSON(),
        titlesDeadlinesBlank: manageCommand.buildSeasonTitlesDeadlinesModal(null).toJSON(),
        draftTitlesDates: manageCommand.buildDraftTitlesDatesModal(SAMPLE_DOC).toJSON(),
        draftBulkDraws: manageCommand.buildDraftBulkDrawsModal(SAMPLE_DOC).toJSON(),
        draftBulkCalendar: manageCommand.buildDraftBulkCalendarModal(SAMPLE_DOC).toJSON()
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
    'a /manage season/draft modal changed shape — the refactor was supposed to be invisible');
console.log('  ✓ every season/draft modal is byte-identical to the pre-refactor fixture');
