// scripts/syncMissingDevEmojis.js Uploads any emoji from utils/emojiMap.js that the DEV bot's Discord application doesn't have yet (matched by name, same convention emojiMap.js's own refreshEmojiIds() uses at boot) -- built 2026-07-31 14:00 EDT because new emojis (buff/nerf, then events/modes) kept shipping prod-side with no equivalent step to clone them to the dev app, so the dev bot boot log's "N unmatched" count kept growing. Re-runnable: only uploads names genuinely missing from the dev app, never touches ones that already exist there.
//
// Source of the actual image bytes: Discord's emoji CDN (cdn.discordapp.com/emojis/{id}.png|gif) is public and needs no auth regardless of which application owns the emoji -- so this fetches the PROD id's image (from emojiMap.js's hardcoded mention strings, which are always prod's own ids) and re-uploads it to the DEV application under the same name.
require('dotenv').config({ quiet: true });
const emojis = require('../utils/emojiMap');

async function main() {
    const devToken = process.env.BOT_TOKEN;
    if (!devToken) throw new Error('BOT_TOKEN not set -- run with --env-file=.env.dev');

    const meRes = await fetch('https://discord.com/api/v10/oauth2/applications/@me', {
        headers: { Authorization: `Bot ${devToken}` }
    });
    if (!meRes.ok) throw new Error(`Failed to resolve dev application id: ${meRes.status} ${await meRes.text()}`);
    const me = await meRes.json();
    const appId = me.id;
    console.log(`Dev application: ${me.name} (${appId})`);

    const existingRes = await fetch(`https://discord.com/api/v10/applications/${appId}/emojis`, {
        headers: { Authorization: `Bot ${devToken}` }
    });
    if (!existingRes.ok) throw new Error(`Failed to list dev emojis: ${existingRes.status} ${await existingRes.text()}`);
    const existing = await existingRes.json();
    const existingNames = new Set((existing.items || existing || []).map(e => e.name));

    const sourceEntries = Object.entries(emojis).filter(([key, value]) => typeof value === 'string' && emojis.parseEmoji(value));
    const missing = sourceEntries.filter(([, value]) => !existingNames.has(emojis.parseEmoji(value).name));

    if (missing.length === 0) {
        console.log('Nothing missing -- dev app already has every emoji by name.');
        return;
    }
    console.log(`Missing ${missing.length}: ${missing.map(([, v]) => emojis.parseEmoji(v).name).join(', ')}`);

    for (const [key, mention] of missing) {
        const parsed = emojis.parseEmoji(mention);
        const ext = parsed.animated ? 'gif' : 'png';
        const cdnUrl = `https://cdn.discordapp.com/emojis/${parsed.id}.${ext}`;
        const imgRes = await fetch(cdnUrl);
        if (!imgRes.ok) {
            console.error(`❌ ${key} (:${parsed.name}:) -- couldn't fetch source image from prod CDN: ${imgRes.status}`);
            continue;
        }
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const dataUri = `data:image/${ext === 'gif' ? 'gif' : 'png'};base64,${buffer.toString('base64')}`;

        const uploadRes = await fetch(`https://discord.com/api/v10/applications/${appId}/emojis`, {
            method: 'POST',
            headers: { Authorization: `Bot ${devToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: parsed.name, image: dataUri })
        });
        if (!uploadRes.ok) {
            console.error(`❌ ${key} (:${parsed.name}:) -- upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
            continue;
        }
        console.log(`✅ ${key} (:${parsed.name}:) uploaded to dev.`);
    }
}

main().catch(err => { console.error('Fatal:', err?.message || err); process.exit(1); });
