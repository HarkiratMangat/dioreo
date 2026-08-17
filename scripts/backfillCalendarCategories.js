// scripts/backfillCalendarCategories.js One-time backfill for the 3-section calendar redesign (2026-07-31 13:10 EDT): every existing calendar[]/draft.calendar[] entry pre-dates the `category` field, so it reads back as the schema default 'event' until touched. Runs adminParser.js's guessCalendarCategory() (the same keyword classifier the live bulk parser and single add/edit modal use) against each entry's own title and writes the result.
//
// Safe to re-run ONLY before any admin has hand-edited a calendar entry's Category field via /manage -- it unconditionally overwrites `category` from the title guess every time, so a manual correction made after this ran once would get reverted by running it again.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const SeasonalData = require('../models/SeasonalData');
const { guessCalendarCategory } = require('../utils/adminParser');

function backfillArray(label, entries) {
    if (!entries || entries.length === 0) {
        console.log(`${label}: no entries.`);
        return { draw: 0, event: 0, playlist: 0 };
    }
    const counts = { draw: 0, event: 0, playlist: 0 };
    for (const entry of entries) {
        const category = guessCalendarCategory(entry.title);
        entry.category = category;
        counts[category]++;
        console.log(`  ${category.padEnd(8)} ${entry.title}`);
    }
    console.log(`${label}: ${entries.length} entries -- draw ${counts.draw}, event ${counts.event}, playlist ${counts.playlist}`);
    return counts;
}

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    const doc = await SeasonalData.findOne({ docType: 'global' });
    if (!doc) {
        console.log('No global SeasonalData document found -- nothing to backfill.');
        await mongoose.disconnect();
        return;
    }

    console.log('--- Live calendar ---');
    backfillArray('Live calendar', doc.calendar);

    if (doc.draft && doc.draft.calendar && doc.draft.calendar.length > 0) {
        console.log('\n--- Draft calendar ---');
        backfillArray('Draft calendar', doc.draft.calendar);
        doc.markModified('draft');
    }

    doc.markModified('calendar');
    await doc.save();
    console.log('\nSaved.');
    await mongoose.disconnect();
}

main().catch(err => { console.error('Fatal:', err?.message || err); process.exit(1); });
