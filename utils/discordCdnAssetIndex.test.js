// utils/discordCdnAssetIndex.test.js -- coverage for the DiscordCdnAsset durable secondary index and its recovery routine (see discordCdnAssetIndex.js's header for the full reasoning: recovering a Cloudinary resource's bytes from the Discord storage-channel message that still holds an untouched copy, when the Cloudinary resource was deleted out-of-band). Stubs the model, cloudinaryClient and global fetch -- no Mongo, no Cloudinary, no network. Run: `node utils/discordCdnAssetIndex.test.js` (also via `npm test`).
const assert = require('assert');
const path = require('path');
const Module = require('module');

// --- Stub models/DiscordCdnAsset BEFORE the module under test requires it. ---
const modelPath = require.resolve('../models/DiscordCdnAsset');
let updateOneCalls = [];
let findOneResult = null;
let findOneThrows = null;
require.cache[modelPath] = new Module(modelPath, null);
require.cache[modelPath].filename = modelPath;
require.cache[modelPath].loaded = true;
require.cache[modelPath].exports = {
    updateOne: async (filter, update, opts) => { updateOneCalls.push({ filter, update, opts }); },
    findOne: (filter) => ({
        lean: async () => {
            if (findOneThrows) throw findOneThrows;
            return findOneResult;
        }
    })
};

// --- Stub utils/cloudinaryClient the same way -- a plain object, not the real Proxy-wrapped SDK. ---
const cloudinaryPath = require.resolve('./cloudinaryClient');
let uploadCalls = [];
let updateCalls = [];
let uploadThrows = null;
let updateThrows = null;
require.cache[cloudinaryPath] = new Module(cloudinaryPath, null);
require.cache[cloudinaryPath].filename = cloudinaryPath;
require.cache[cloudinaryPath].loaded = true;
require.cache[cloudinaryPath].exports = {
    uploader: {
        upload: async (dataUri, opts) => {
            uploadCalls.push({ dataUri, opts });
            if (uploadThrows) throw uploadThrows;
            return { secure_url: 'https://res.cloudinary.com/demo/image/upload/recovered.webp' };
        }
    },
    api: {
        update: async (publicId, opts) => {
            updateCalls.push({ publicId, opts });
            if (updateThrows) throw updateThrows;
            return {};
        }
    }
};

const { recordDiscordCdnAsset, getDiscordCdnAsset, recoverCloudinaryFromDiscordCdnAsset } = require('./discordCdnAssetIndex');

let failures = 0;
const checks = [];
function check(name, fn) { checks.push([name, fn]); }
async function run() {
    for (const [name, fn] of checks) {
        try { await fn(); console.log(`  ✓ ${name}`); }
        catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.stack}`); }
    }
}

function resetStubs() {
    updateOneCalls = []; findOneResult = null; findOneThrows = null;
    uploadCalls = []; updateCalls = []; uploadThrows = null; updateThrows = null;
    global.fetch = async () => { throw new Error('fetch stub not configured for this test'); };
}

const RECORD = {
    publicId: 'nameplate_webp/eternal-damnation-black',
    kind: 'nameplate',
    discordChannelId: 'CHANNEL1',
    discordMessageId: 'MSG1',
    discordCdnUrl: 'https://cdn.discordapp.com/attachments/CHANNEL1/MSG1/eternal-damnation-black.webp',
    filename: 'eternal-damnation-black.webp'
};

// --- recordDiscordCdnAsset ---------------------------------------------------------------------

check('recordDiscordCdnAsset: upserts on publicId, sets every field', async () => {
    resetStubs();
    await recordDiscordCdnAsset({
        publicId: RECORD.publicId, kind: 'nameplate', channelId: 'CHANNEL1',
        messageId: 'MSG1', discordCdnUrl: RECORD.discordCdnUrl, filename: RECORD.filename
    });
    assert.strictEqual(updateOneCalls.length, 1);
    assert.deepStrictEqual(updateOneCalls[0].filter, { publicId: RECORD.publicId });
    assert.strictEqual(updateOneCalls[0].opts.upsert, true);
    assert.strictEqual(updateOneCalls[0].update.$set.discordChannelId, 'CHANNEL1');
    assert.strictEqual(updateOneCalls[0].update.$set.discordMessageId, 'MSG1');
});

check('recordDiscordCdnAsset: any missing required field is a no-op, never throws', async () => {
    resetStubs();
    await recordDiscordCdnAsset({ publicId: 'x', kind: 'nameplate', channelId: null, messageId: 'M', discordCdnUrl: 'u', filename: 'f' });
    assert.strictEqual(updateOneCalls.length, 0);
});

check('recordDiscordCdnAsset: a Mongo failure is swallowed, never throws', async () => {
    resetStubs();
    require.cache[modelPath].exports.updateOne = async () => { throw new Error('connection reset'); };
    await assert.doesNotReject(recordDiscordCdnAsset({
        publicId: RECORD.publicId, kind: 'nameplate', channelId: 'C', messageId: 'M', discordCdnUrl: 'u', filename: 'f'
    }));
    require.cache[modelPath].exports.updateOne = async (filter, update, opts) => { updateOneCalls.push({ filter, update, opts }); };
});

// --- getDiscordCdnAsset ------------------------------------------------------------------------

check('getDiscordCdnAsset: returns the found record', async () => {
    resetStubs();
    findOneResult = RECORD;
    const got = await getDiscordCdnAsset(RECORD.publicId);
    assert.strictEqual(got, RECORD);
});

check('getDiscordCdnAsset: returns null when nothing is indexed for this publicId', async () => {
    resetStubs();
    findOneResult = null;
    assert.strictEqual(await getDiscordCdnAsset('never-cached'), null);
});

check('getDiscordCdnAsset: a Mongo failure degrades to null, never throws', async () => {
    resetStubs();
    findOneThrows = new Error('connection reset');
    assert.strictEqual(await getDiscordCdnAsset(RECORD.publicId), null);
});

// --- recoverCloudinaryFromDiscordCdnAsset -------------------------------------------------------

check('recoverCloudinaryFromDiscordCdnAsset: no index record -> null, no Cloudinary or network calls', async () => {
    resetStubs();
    findOneResult = null;
    const result = await recoverCloudinaryFromDiscordCdnAsset('unknown-public-id', 'nameplate_webp');
    assert.strictEqual(result, null);
    assert.strictEqual(uploadCalls.length, 0);
    assert.strictEqual(updateCalls.length, 0);
});

check('recoverCloudinaryFromDiscordCdnAsset: happy path re-uploads the recovered bytes and restores context', async () => {
    resetStubs();
    findOneResult = RECORD;
    let fetchedUrl = null;
    global.fetch = async (url) => {
        fetchedUrl = url;
        return { ok: true, arrayBuffer: async () => Buffer.from('fake-webp-bytes').buffer };
    };
    const result = await recoverCloudinaryFromDiscordCdnAsset(RECORD.publicId, 'nameplate_webp');
    assert.strictEqual(fetchedUrl, RECORD.discordCdnUrl, 'must re-fetch the EXACT recorded Discord CDN url, never a re-derived one');
    assert.deepStrictEqual(result, {
        cloudinaryUrl: 'https://res.cloudinary.com/demo/image/upload/recovered.webp',
        discordCdnUrl: RECORD.discordCdnUrl
    });
    assert.strictEqual(uploadCalls.length, 1, 'must re-upload the recovered bytes to the SAME public_id');
    assert.strictEqual(uploadCalls[0].opts.public_id, RECORD.publicId);
    assert.strictEqual(uploadCalls[0].opts.overwrite, true);
    assert.strictEqual(updateCalls.length, 1, 'must patch context with the recovery markers');
    assert.strictEqual(updateCalls[0].opts.context.discord_cdn_url, RECORD.discordCdnUrl);
    assert.strictEqual(updateCalls[0].opts.context.discord_message_id, RECORD.discordMessageId);
    assert.strictEqual(updateCalls[0].opts.context.render_source, 'recovered', 'must mark the recovery so scripts/bulkCacheCollectibles.js can re-attach catalog metadata later');
});

check('recoverCloudinaryFromDiscordCdnAsset: the recorded Discord CDN url no longer resolving (HTTP failure) degrades to null, never throws', async () => {
    resetStubs();
    findOneResult = RECORD;
    global.fetch = async () => ({ ok: false, status: 404 });
    const result = await recoverCloudinaryFromDiscordCdnAsset(RECORD.publicId, 'nameplate_webp');
    assert.strictEqual(result, null);
    assert.strictEqual(uploadCalls.length, 0, 'must not attempt a Cloudinary upload with no bytes');
});

check('recoverCloudinaryFromDiscordCdnAsset: a Cloudinary upload failure degrades to null, never throws', async () => {
    resetStubs();
    findOneResult = RECORD;
    global.fetch = async () => ({ ok: true, arrayBuffer: async () => Buffer.from('fake-webp-bytes').buffer });
    uploadThrows = { message: 'Cloudinary is down', http_code: 500 };
    const result = await recoverCloudinaryFromDiscordCdnAsset(RECORD.publicId, 'nameplate_webp');
    assert.strictEqual(result, null);
});

check('recoverCloudinaryFromDiscordCdnAsset: a context-patch failure AFTER a successful upload still degrades to null, never throws (never returns half-recovered)', async () => {
    resetStubs();
    findOneResult = RECORD;
    global.fetch = async () => ({ ok: true, arrayBuffer: async () => Buffer.from('fake-webp-bytes').buffer });
    updateThrows = { message: 'context patch failed', http_code: 500 };
    const result = await recoverCloudinaryFromDiscordCdnAsset(RECORD.publicId, 'nameplate_webp');
    assert.strictEqual(result, null, 'a bytes-restored-but-context-unpatched resource must not be reported as a success');
});

run().then(() => {
    if (failures > 0) {
        console.error(`❌ discordCdnAssetIndex: ${failures} case(s) failed`);
        process.exit(1);
    }
    console.log(`✅ discordCdnAssetIndex: ${checks.length} cases passed`);
});
