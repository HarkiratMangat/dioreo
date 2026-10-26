#!/usr/bin/env node
// ==========================================
// MIGRATE RenderTiming -> the event plane, then drop it
// ==========================================
// One-shot migration for the observability layer's stage 2 (2026-08-16). RenderTiming was added 2026-08-11 for a single /colors performance investigation and stored a **raw** `discordId`. Its rows are migrated with that id HASHED through the same hashUserId() every other pseudonym in this project uses, so the migration strictly REDUCES the raw-id surface rather than relocating it -- and then the source collection is dropped, which is the only thing that makes that reduction real.
//
// Its /colors-specific fields (area, source, subpage, variant, cold) land in the event document's generic `detail` sub-object, which the schema needed anyway.
//
// 🔴 THE HASH KEY MUST BE THE RIGHT ONE. Run this against PROD with PROD's ANALYTICS_HMAC_KEY, or the migrated hashes will not correlate with anything the live bot writes. There is no way to detect that afterwards -- both key's outputs are 64 hex characters and both look perfectly fine.
//
// Usage:
//   node --env-file=.env.dev scripts/migrateRenderTimings.js          # dry run, prints a plan
//   node --env-file=.env.dev scripts/migrateRenderTimings.js --write  # migrate, then drop the source
//
// Safe to re-run: --write is a no-op once the source collection is gone.

require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const { hashUserId } = require('../utils/requestContext');
const { VERSION, COMMIT } = require('../utils/logger');

const WRITE = process.argv.includes('--write');
const SOURCE = 'rendertimings';   // Mongoose's pluralised/lowercased name for model('RenderTiming')

(async () => {
    if (!process.env.ANALYTICS_HMAC_KEY) {
        console.error('❌ ANALYTICS_HMAC_KEY is not set. Refusing to run: every migrated row would carry a hash from an ephemeral per-process key and would correlate with nothing, permanently.');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    console.log(`📚 Database: ${mongoose.connection.name}`);

    const existing = await db.listCollections({ name: SOURCE }).toArray();
    if (!existing.length) {
        console.log(`✅ No \`${SOURCE}\` collection here — nothing to migrate (already done, or this database never had one).`);
        await mongoose.disconnect();
        return;
    }

    const rows = await db.collection(SOURCE).find({}).toArray();
    console.log(`📦 ${rows.length} RenderTiming row(s) to migrate.`);

    const docs = rows.map((r) => ({
        userHash: hashUserId(r.discordId),           // the raw id stops here and goes no further
        guildId: r.guildId || null,
        context: r.guildId ? 'guild' : 'dm',
        installType: null,                            // not knowable retroactively
        isAdmin: false,
        command: r.area === 'colors_panel' ? 'colors' : `webp_${r.action || 'render'}`,
        subcommand: null,
        entry: 'background',                          // these were never per-interaction rows
        customIdPrefix: null,
        outcome: 'ok',
        ackMs: null,
        durationMs: typeof r.durationMs === 'number' ? r.durationMs : null,
        detail: Object.fromEntries(Object.entries({
            area: r.area, action: r.action, source: r.source,
            subpage: r.subpage, variant: r.variant, cold: r.cold,
            migratedFrom: 'RenderTiming',
        }).filter(([, v]) => v !== undefined && v !== null)),
        version: VERSION,
        commit: COMMIT,
        host: r.host || null,
        createdAt: r.createdAt || new Date(),
    }));

    // The migration's own version of the project's highest-value test, run on the real data rather than a fixture: if ANY raw discordId survived into ANY finished document, stop before writing.
    const rawIds = new Set(rows.map(r => r.discordId).filter(Boolean));
    const serialised = JSON.stringify(docs);
    const leaked = [...rawIds].filter(id => serialised.includes(String(id)));
    if (leaked.length) {
        console.error(`❌ ${leaked.length} raw Discord id(s) survived into the migrated documents. Refusing to write.`);
        process.exit(1);
    }
    console.log(`🔒 Verified: none of the ${rawIds.size} distinct raw Discord id(s) appears anywhere in the ${docs.length} migrated document(s).`);

    if (!WRITE) {
        console.log('\n🔍 DRY RUN — nothing written, nothing dropped. Re-run with --write to apply.');
        console.log('Sample:', JSON.stringify(docs[0], null, 2));
        await mongoose.disconnect();
        return;
    }

    if (docs.length) {
        const AnalyticsEvent = require('../models/AnalyticsEvent');
        await AnalyticsEvent.insertMany(docs, { ordered: false });
        console.log(`✅ Inserted ${docs.length} event document(s).`);
    }
    await db.collection(SOURCE).drop();
    console.log(`🗑️  Dropped \`${SOURCE}\`. The raw discordId column no longer exists anywhere in this database.`);
    await mongoose.disconnect();
})().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
