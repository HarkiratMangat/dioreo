// scripts/newsTriageReplay.js -- run news-channel triage on one real post, on the dev bot (built 2026-11-04 20:10 EST). Reads the post with Dioreo Admin (Dev)'s token, runs the same pipeline the live watcher runs (the AI read included, so it spends one Vertex call), and posts the card into the dev NEWS_CHANNEL. Nothing is written to Dioreo's data: the card's buttons open /manage's boxes on the running dev bot.
//
//   node --env-file=.env.dev scripts/newsTriageReplay.js <channel id> <message id | --find "words">  [--dry]
//
// --find picks the newest of the channel's last 100 posts containing the words. --dry prints what the AI read and where each item would go, and posts nothing. Refuses any database but diors-builds-dev.
const { REST } = require('discord.js');
const mongoose = require('mongoose');
const pipeline = require('../utils/newsTriage/pipeline');

(async () => {
    const [channelId, target, words] = process.argv.slice(2).filter(a => a !== '--dry');
    const dry = process.argv.includes('--dry');
    if (!channelId || !target) { console.error('usage: newsTriageReplay.js <channel id> <message id | --find "words"> [--dry]'); process.exit(2); }
    if (!process.env.ADMIN_BOT_TOKEN) { console.error('ADMIN_BOT_TOKEN is not set: run with --env-file=.env.dev'); process.exit(2); }
    await mongoose.connect(process.env.MONGODB_URI);
    if (mongoose.connection.name !== 'diors-builds-dev') { console.error(`Refusing: database is ${mongoose.connection.name}, not diors-builds-dev`); process.exit(2); }
    const rest = new REST({ version: '10' }).setToken(process.env.ADMIN_BOT_TOKEN);
    const channel = await rest.get(`/channels/${channelId}`);
    // The card is composed under Dioreo Admin (Dev)'s own emoji ids, as the live watcher does; the emoji map is filled from the app's list without logging in (a second gateway login on the same token would split the running dev bot's clicks).
    const app = await rest.get('/applications/@me');
    await require('../utils/emojiMap').refreshEmojiIds({ rest, application: { id: app.id } }, { secondary: true });
    let raw;
    if (target === '--find') {
        const list = await rest.get(`/channels/${channelId}/messages?limit=100`);
        raw = list.find(m => (m.content || '').toLowerCase().includes(String(words || '').toLowerCase()));
        if (!raw) { console.error('No post in the last 100 contains those words.'); process.exit(1); }
    } else raw = await rest.get(`/channels/${channelId}/messages/${target}`);
    const post = pipeline.toPost(raw, { guildId: channel.guild_id, channelName: channel.name });
    console.log(`Post ${post.id} (${post.createdAt.toISOString()}): ${post.title}`);
    if (dry) {
        const ctx = await pipeline.loadContext(post.createdAt);
        const items = await require('../utils/newsTriage/model').readPost({ text: post.text, imageUrl: post.image, postedAt: post.createdAt, liveSeason: ctx.liveSeason });
        console.log('AI read:', JSON.stringify(items, null, 1));
        const { card, skipped } = require('../utils/newsTriage/resolve').resolveItems(items, ctx);
        console.log('Card items:', JSON.stringify(card.map(i => ({ name: i.name, where: i.where, action: i.action, drawType: i.drawType, start: i.start, warnings: i.warnings })), null, 1));
        console.log('Skipped:', JSON.stringify(skipped));
    } else {
        const result = await pipeline.processPost(post, { rest, appId: app.id, force: true });
        console.log('Result:', JSON.stringify(result));
    }
    await mongoose.disconnect();
})().catch(err => { console.error(err); process.exit(1); });
