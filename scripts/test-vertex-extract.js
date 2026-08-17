// scripts/test-vertex-extract.js Antigravity (2026-07-20): Scratch verification script to test the Vertex AI keyless migration. Connects to your real MongoDB database, pulls an imageKey, constructs a Cloudinary URL, and executes the extractLoadoutFromImage pipeline against Vertex AI.

require('dotenv').config({ quiet: true }); // quiet: true suppresses dotenv's log line + its rotating promotional "tip"
const mongoose = require('mongoose');
const Loadout = require('../models/Loadout');
const { extractLoadoutFromImage } = require('../utils/visionExtract');

async function main() {
    console.log('🔄 Starting keyless Vertex AI extraction test...');
    console.log(`📍 Using Project ID: ${process.env.GCP_PROJECT_ID || 'gen-lang-client-0549308254'}`);
    console.log(`📍 Using Location: ${process.env.GCP_LOCATION || 'us'}`); // Claude (2026-07-20): fixed to match visionExtract.js's corrected DEFAULT_LOCATION

    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI is not defined in .env');
        process.exit(1);
    }

    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully.');

        // Find a loadout with a bare Cloudinary key (not a full external URL)
        console.log('🔍 Querying MongoDB for an active loadout with screenshot...');
        const loadout = await Loadout.findOne({ 
            imageKey: { $exists: true, $ne: '' },
            mode: 'MP' 
        });

        if (!loadout) {
            console.error('❌ No loadout document found with a valid imageKey.');
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log(`📝 Found loadout: [${loadout.weaponName}] - imageKey: "${loadout.imageKey}"`);
        
        // Construct the full Cloudinary URL
        const imageUrl = loadout.imageKey.startsWith('http') 
            ? loadout.imageKey 
            : `https://res.cloudinary.com/dr6dn61eh/image/upload/f_auto,q_auto/v1/${loadout.imageKey}`;

        console.log(`🖼️ Constructed Cloudinary Image URL: ${imageUrl}`);
        console.log('🧠 Invoking Vertex AI Gemini 3.5 Flash Vision Extraction (Keyless ADC)...');

        const startTime = Date.now();
        const extracted = await extractLoadoutFromImage(imageUrl, { taskName: 'manual_test_script' });
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n✨ ===== EXTRACTION RESULT ===== ✨');
        console.log(`⏱️ Duration: ${duration}s`);
        console.log(JSON.stringify(extracted, null, 2));
        console.log('===================================\n');
        console.log('✅ Test finished successfully!');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    } finally {
        console.log('🔌 Disconnecting from MongoDB...');
        await mongoose.disconnect();
        console.log('🔌 Disconnected.');
    }
}

main();
