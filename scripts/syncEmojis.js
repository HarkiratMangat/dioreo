#!/usr/bin/env node
/**
 * Syncs application emojis from prod to the dev bot -- the gap `dior emoji check` was mistaken for.
 *
 * `utils/emojiMap.js`'s refreshEmojiIds() (runs on every boot, both bots) only RE-POINTS an existing
 * mention string at the SAME-NAMED emoji already uploaded to the booting app -- it has no way to
 * create an emoji that doesn't exist yet on that app. The one-time "clone all 72" (2026-07-26, see
 * docs/reference/deployment-and-ops.md) was a manual action, and nothing since has kept the two apps'
 * emoji lists in sync as new ones get added to prod -- "Guide" (added 2026-07-31) is the first
 * confirmed casualty, found live 2026-08-07 when it silently failed to render on the dev bot.
 *
 * By NAME, not id -- an app-emoji upload gets a brand-new id even for identical bytes, so id
 * comparison would always show a mismatch. Fetches each missing emoji's image bytes from PROD's own
 * CDN (public, no auth needed) and re-uploads to the dev app via the same POST endpoint the original
 * 72-emoji clone used by hand. Animated emojis over Discord's 256 KB app-emoji cap need re-encoding
 * before this can upload them (3 of the original 72 needed this) -- this script reports that case
 * rather than silently failing or guessing a re-encode.
 *
 * Usage:
 *   node scripts/syncEmojis.js            (dry run -- lists what's missing, uploads nothing)
 *   node scripts/syncEmojis.js --apply    (actually uploads the missing ones)
 *
 * Needs BOTH .env (prod BOT_TOKEN, to read prod's emoji list) and .env.dev (dev BOT_TOKEN, to read
 * and write dev's) -- run this from Harkirat's own machine, which has both. Deliberately NOT wired
 * into the dev bot's own boot sequence: that process only ever loads .env.dev, and giving the running
 * bot process a path to prod's token is a bigger surface than a one-off local sync script needs.
 */
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const API = 'https://discord.com/api/v10';
const MAX_EMOJI_BYTES = 256 * 1024; // Discord's app-emoji cap

function loadToken(envFile) {
    const parsed = dotenv.parse(fs.readFileSync(path.join(__dirname, '..', envFile)));
    if (!parsed.BOT_TOKEN) throw new Error(`${envFile} has no BOT_TOKEN`);
    return parsed.BOT_TOKEN;
}

async function getAppId(token) {
    const res = await fetch(`${API}/applications/@me`, { headers: { Authorization: `Bot ${token}` } });
    if (!res.ok) throw new Error(`applications/@me failed: ${res.status}`);
    const app = await res.json();
    return app.id;
}

async function listEmojis(token, appId) {
    const res = await fetch(`${API}/applications/${appId}/emojis`, { headers: { Authorization: `Bot ${token}` } });
    if (!res.ok) throw new Error(`list emojis failed: ${res.status}`);
    const data = await res.json();
    return data.items || data;
}

async function uploadEmoji(token, appId, name, dataUri) {
    const res = await fetch(`${API}/applications/${appId}/emojis`, {
        method: 'POST',
        headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image: dataUri })
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`upload failed (${res.status}): ${body}`);
    }
    return res.json();
}

async function main() {
    const apply = process.argv.includes('--apply');

    const prodToken = loadToken('.env');
    const devToken = loadToken('.env.dev');

    const prodAppId = await getAppId(prodToken);
    const devAppId = await getAppId(devToken);

    const [prodEmojis, devEmojis] = await Promise.all([
        listEmojis(prodToken, prodAppId),
        listEmojis(devToken, devAppId)
    ]);

    const devNames = new Set(devEmojis.map(e => e.name));
    const missing = prodEmojis.filter(e => !devNames.has(e.name));

    if (missing.length === 0) {
        console.log(`In sync -- dev app has all ${prodEmojis.length} of prod's emoji names.`);
        return;
    }

    console.log(`${missing.length} emoji(s) on prod missing from dev:`);
    for (const e of missing) console.log(`  - ${e.name} (${e.animated ? 'animated' : 'static'}, id ${e.id})`);

    if (!apply) {
        console.log('\nDry run -- nothing uploaded. Re-run with --apply to sync.');
        return;
    }

    for (const e of missing) {
        const ext = e.animated ? 'gif' : 'png';
        const cdnUrl = `https://cdn.discordapp.com/emojis/${e.id}.${ext}`;
        const imgRes = await fetch(cdnUrl);
        if (!imgRes.ok) {
            console.log(`  SKIP ${e.name}: could not fetch ${cdnUrl} (${imgRes.status})`);
            continue;
        }
        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.length > MAX_EMOJI_BYTES) {
            console.log(`  SKIP ${e.name}: ${buf.length}B exceeds the ${MAX_EMOJI_BYTES}B app-emoji cap -- needs manual re-encoding (same as Database/BulkDelete/Edit during the original clone), then a manual upload via the Dev Discord application's Developer Portal.`);
            continue;
        }
        const mime = e.animated ? 'image/gif' : 'image/png';
        const dataUri = `data:${mime};base64,${buf.toString('base64')}`;
        try {
            const created = await uploadEmoji(devToken, devAppId, e.name, dataUri);
            console.log(`  OK   ${e.name} -> dev id ${created.id}`);
        } catch (err) {
            console.log(`  FAIL ${e.name}: ${err.message}`);
        }
    }
}

main().catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});
