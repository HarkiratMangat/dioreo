// scripts/setSeasonDates.js -- give a past season its own dates, its Battle Pass start and end, so /patch notes' dropdown shows them instead of release date to next release date (2026-10-28). Promote to Live saves them for the outgoing season from now on; this is for seasons that rotated before that.
//
// Usage: node --env-file=<env file> scripts/setSeasonDates.js <season number or name> <start YYYY-MM-DD> <end YYYY-MM-DD> [--write] Without --write it only prints what it would change. The write goes through the operation core as the owner, so it shows on /bot analytics' Changes page and can be reverted there.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const SeasonalData = require('../models/SeasonalData');
const { findPatchByQuery, displayTitle } = require('../commands/patchnotes');
const { commitSet } = require('../core/changeset');
const { ALLOWED_ADMIN_ID } = require('../utils/owner');

const day = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? new Date(`${s}T00:00:00Z`) : null;
const show = d => (d ? new Date(d).toISOString().slice(0, 10) : 'none');

async function main() {
    const [query, startArg, endArg] = process.argv.slice(2).filter(a => a !== '--write');
    const write = process.argv.includes('--write');
    const start = day(startArg), end = day(endArg);
    if (!query || !start || !end) throw new Error('Usage: scripts/setSeasonDates.js <season> <start YYYY-MM-DD> <end YYYY-MM-DD> [--write]');
    await mongoose.connect(process.env.MONGODB_URI);
    const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
    const entry = findPatchByQuery(doc?.patchNotes || [], query);
    if (!entry) throw new Error(`No patch notes season matches "${query}".`);
    console.log(`${displayTitle(entry)} (${entry._id}) on ${mongoose.connection.name}: ${show(entry.seasonStart)} – ${show(entry.seasonEnd)} -> ${show(start)} – ${show(end)}`);
    if (!write) { console.log('Dry run. Add --write to save.'); return mongoose.disconnect(); }
    const result = await commitSet([{ type: 'patchnote.setSeasonDates', target: { elementId: String(entry._id) }, payload: { seasonStart: start, seasonEnd: end } }], { actorId: ALLOWED_ADMIN_ID });
    if (!result.ok) throw new Error(JSON.stringify(result.failures || result.error || result.denied));
    console.log(`Saved, change ${result.changeIds[0]}.`);
    await mongoose.disconnect();
}

main().catch(err => { console.error('Fatal:', err?.message || err); process.exit(1); });
