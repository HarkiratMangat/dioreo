---
kind: record
status: frozen
---

# B7's render harness for #testing-spam

*Written 2026-10-30 15:28 EDT by B7's session, so the lead (or the next builder) can re-post B7's renders from the real code. It extends B6's harness (`docs/claude/2026-10-30-b6-render-harness.md`, which explains the token, the proxy and the cleanup scripts); only what differs is here. The cloud container's scratchpad, where these ran, is gone once the session ends.*

## What differs from B6's

- **`lib.js` stubs the models, not `utils/guildPolicy`**: `models/GuildSettings` (no settings) and `models/TextPenalty`, so the real B7 resolver, prefixes and spam ladder run. Prefixes are `d,dior` (B6 removed `/`).
- **`owner.js`** posts B7's owner tools in order (`node owner.js a`, then `ROOT=<a pre-B7 checkout> node owner.js old` for the "before" `/bot servers`, then `node owner.js b`). It stubs `models/BotControls`, `models/TextMisfire` and `models/AnalyticsEvent` with fixed numbers, gives the panels a fake public client holding Dioreoland's real channel ids (so channel mentions resolve), and fakes `mongoose.connection.readyState` only AFTER every real model has compiled (faking it earlier makes model compilation try to open a connection and throw).
- **The join/leave feed** is rendered through the real `bot/lifecycle.js` listeners with `global.fetch` captured instead of the webhook post.
- **`botpage.js`** replaces renders 14-15 with the single `/bot` help page and its dropdown.
- Run each with `ROOT=<repo>`; on the Mac drop the `undici` proxy lines and pass the dev token from `.env.dev`, as B6's note says.

## `lib.js`

```js
// Scratch render harness for B6: builds the text-command messages with the real code, posts them to #testing-spam as the dev bot (the proxy supplies the token).
const path = require('path');
const ROOT = process.env.ROOT || '/home/user/dioreo';
const R = rel => path.join(ROOT, rel);
const { REST } = require(R('node_modules/discord.js'));
const CHANNEL = '1536403911676792892';
const DEV = '1529636846248919263';
const undici = require(R('node_modules/undici'));
undici.setGlobalDispatcher(new undici.EnvHttpProxyAgent());
const rest = new REST({ version: '10', makeRequest: undici.request ? (url, init) => undici.fetch(url, init) : undefined }).setToken('dummy');
const stub = (rel, exports) => { const f = require.resolve(R(rel)); require.cache[f] = { id: f, filename: f, loaded: true, exports }; };
stub('utils/textCommands/permissions', { textCommandAllowed: async () => true, invalidateGuildOverrides() {} });
stub('handlers/router', { buildInteractionContext: () => ({}) });
stub('models/GuildSettings', { findOne: () => ({ lean: async () => null }) });
stub('models/TextPenalty', { updateOne: async () => ({}), deleteOne: async () => ({}), find: () => ({ lean: async () => [] }) });
stub('utils/eventStore', { recordInteractionEvent() {} });
stub('utils/userStats', { noteOwnCommandSafely() {} });
const WEAPONS = [{ name: '[AR] AK117', value: 'ak117' }, { name: '[AR] AK-47', value: 'ak47' }];
const SEASONS = [{ name: 'Season 9: Haunted', value: 'id9' }, { name: 'Season 8: Terminated', value: 'id8' }, { name: 'Season 7: Monster Hunt', value: 'id7' }];
stub('utils/autocomplete', { runAutocomplete: async i => i.respond(i.commandName === 'patch' ? SEASONS : WEAPONS) });
process.env.TEXT_PREFIXES = 'd,dior';
process.env.NODE_ENV = 'test';
const emojis = require(R('utils/emojiMap'));
const pool = [['KILO 141', 'kilo141', 'AR'], ['KILO BOLT-ACTION', 'kiloboltaction', 'SNIPER'], ['AK117', 'ak117', 'AR']].map(([weaponName, weaponKey, category]) => ({ weaponName, weaponKey, category, noBuild: false }));
async function textWeapon(mode, text) {
    const p = require(R('utils/search')).pickWeapon(text, pool);
    const view = w => ({ value: w.weaponKey, label: w.weaponName });
    return { hit: p.hit ? view(p.hit) : null, several: p.several.map(view), loose: p.loose.map(view) };
}
const commands = new Map([['gunsmith', { execute: async () => {}, textWeapon }], ['timestamp', { execute: async () => {}, expandShorthand: require(R('commands/timestamp')).expandShorthand }], ['patch', { execute: async () => {} }], ['today', { execute: async () => {} }]]);
const client = { user: { id: DEV, username: 'Dioreo (Dev)' }, application: { id: DEV, emojis: { cache: null } }, textMessageContent: true, commands, rest, commandIds: new Map(), guilds: { cache: new Map([['g1', {}]]) } };
async function boot() {
    await emojis.refreshEmojiIds(client);
    const appEmojis = (await rest.get(`/applications/${DEV}/emojis`)).items;
    client.application.emojis.cache = { find: fn => appEmojis.find(fn) };
    const cmds = await rest.get(`/applications/${DEV}/commands`);
    for (const c of cmds) client.commandIds.set(c.name, c.id);
    require(R('utils/commandMentions')).recordCommandIds?.(client.commandIds);
}
// Captures what onMessage would send, without sending.
function fakeMessage(content, opts = {}) {
    const posts = [];
    const c = { ...client, rest: { post: async (route, o) => { posts.push(o.body); return { id: 'x' }; }, patch: async () => ({}), get: async () => ({}), delete: async () => ({}) } };
    const channel = { id: opts.channel || 'c' + String(Math.random()).slice(2), permissionsFor: () => ({ has: () => opts.canPost !== false }), isThread: () => false, sendTyping: async () => {} };
    const message = { id: String(Math.random()).slice(2), guildId: 'g1', channelId: channel.id, channel, client: c, content,
        author: { id: opts.author || String(Math.random()).slice(2), bot: false, send: async b => posts.push({ dm: true, ...b }) }, member: null, createdTimestamp: Date.now(),
        guild: { name: 'Dioreoland', members: { me: {} }, roles: { botRoleFor: () => (opts.roleId ? { id: opts.roleId } : null) } }, reference: null, fetchReference: async () => null };
    return { message, posts };
}
async function capture(content, opts) {
    const { onMessage } = require(R('bot/textCommands'));
    const { message, posts } = fakeMessage(content, opts);
    await onMessage(message);
    return posts;
}
const clean = b => { const o = { ...b }; delete o.message_reference; delete o.dm; o.allowed_mentions = { parse: [] }; return o; };
async function post(body) { return rest.post(`/channels/${CHANNEL}/messages`, { body: clean(body) }); }
async function label(text) { return post({ content: text }); }
module.exports = { R, rest, client, boot, capture, post, label, emojis, CHANNEL, DEV, fakeMessage };
```

## `owner.js`

```js
// B7 owner tools renders. argv[2]: 'a' (header + penalties + freeze), 'old' (before: /bot servers, run with ROOT=old), 'b' (after: /bot servers, feed, /help pages).
const L = require('./lib');
const R = L.R;
const part = process.argv[2];
const stub = (rel, exports) => { let f; try { f = require.resolve(R(rel)); } catch { return; } require.cache[f] = { id: f, filename: f, loaded: true, exports }; };
const GUILD = '1325917838996668426';
const CH = { chat: '1325917838996668428', leaks: '1325918070203617361', admin: '1325920631224664165', spam: '1325921453677350943', logs: '1325923570504695939', rules: '1325924889160319150', clips: '1325917839437201408', stats: '1325919561777807442' };
const ADMIN_BOT = '1561783498770227300';
stub('models/BotControls', { updateOne: async () => ({}), findById: () => ({ lean: async () => null }) });
stub('models/TextMisfire', { bulkWrite: async () => ({}), aggregate: async () => [
    { _id: { kind: 'didYouMean', word: 'draws/today', via: 'd+typo' }, count: 14 },
    { _id: { kind: 'noMatch', word: 'gunsmith', via: 'mention' }, count: 6 },
    { _id: { kind: 'pick', word: 'patch notes', via: 'mention' }, count: 2 },
] });
stub('models/AnalyticsEvent', { aggregate: async () => [{ n: 412, errors: 3, typed: 96 }] });
const SETTINGS = { guildId: GUILD, defaultVisibility: 'public', channelRules: [{ channelId: CH.chat, visibility: 'ephemeral' }], roleRules: [], ephemeralCommands: [], commandSettings: [], textRules: { defaultVisibility: 'public', channelRules: [{ channelId: CH.rules, visibility: 'ephemeral' }], roleRules: [], commandSettings: [] }, textPrefixes: ['!'], updatedBy: L.DEV, updatedAt: new Date(Date.now() - 3 * 864e5) };
require(R('models/GuildSettings')).findOne = () => ({ lean: async () => SETTINGS });
const perms = require(R('utils/textCommands/permissions'));
perms.guildOverrides = async () => [{ id: 'cmdcolors', permissions: [{ id: GUILD, type: 1, permission: false }] }];
const v2 = components => ({ flags: 32768, components });
const send = async (label, components) => { await L.label(label); await L.post(v2(components)); };
const chan = (id, canPost) => ({ id, type: 0, permissionsFor: () => ({ has: () => canPost }) });
const guild = { id: GUILD, name: 'Dioreoland', memberCount: 4210, members: { me: {} }, channels: { cache: new Map(Object.entries(CH).map(([k, id]) => [id, chan(id, !['logs', 'rules'].includes(k))])) }, leave: async () => {} };
const pub = { guilds: { cache: new Map([[GUILD, guild], ['1400000000000000002', { name: 'CODM Lobby' }]]) }, application: { id: L.DEV }, user: { id: L.DEV }, rest: L.rest };
(async () => {
    await L.boot();
    require(R('bot/clients')).setClients({ public: pub });
    const bot = require(R('commands/bot'));
    // The panels read the database only when Mongo says it is connected; every model they read is stubbed above, so say it is, once every real model has been compiled.
    require(R('bot/lifecycle'));
    require(R('models/AlertLog'));
    Object.defineProperty(require(R('node_modules/mongoose')).connection, 'readyState', { get: () => 1, configurable: true });
    const client = { ...L.client, guilds: pub.guilds };
    if (part === 'a') {
        const controls = require(R('utils/botControls'));
        const spam = require(R('utils/textCommands/spamLadder'));
        const fake = (uid, gid) => ({ id: 'm', guildId: gid, channelId: 'c', client: { rest: { post: async () => ({ id: 'n' }), patch: async () => ({}), delete: async () => ({}) } }, author: { id: uid }, guild: { name: 'x' } });
        await spam.startPenalty(fake(L.DEV, GUILD), { canPost: false });
        await spam.startPenalty(fake(ADMIN_BOT, '1400000000000000002'), { canPost: false });
        for (let k = 0; k < 3; k++) await spam.extendPenalty(ADMIN_BOT);
        await controls.setFlag('exemptUsers', '1100000000000000001', true);
        await L.post({ content: `# B7 · the owner's tools\n-# Built while you were away, one item per post, oldest first. Every render is the real code (only Discord and the database are stood in). React or reply with a number to change one.` });
        await send('## 1 · /bot penalties\n-# **New** · your layout: a plain list of who is on one, then **Look Up a User** (or `/bot penalties user:<id>`). The ladder sits under it, with **Tune the Ladder**', bot.buildPenaltiesPanel(client));
        await send('## 2 · one person, opened by ID\n-# **New** · Lift, Extend (next rung, or minutes you type), Exempt, Block', bot.buildPenaltyUserPanel(client, ADMIN_BOT));
        await send('## 3 · Block takes two presses\n-# **New** · blocked: typed commands ignored, slash commands get one private line, everywhere', bot.buildPenaltyUserPanel(client, ADMIN_BOT, { armed: 'block' }));
        await L.label('## 4 · what a blocked person sees on a slash command\n-# **New** · private, only them');
        await L.post({ content: `${L.emojis.cross} Dioreo isn't available to you.` });
        controls.__reset({ spam: { reply: 1, warning: 3, threshold: 8, rungsMin: [1, 5, 30, 120, 360, 720] } });
        await send('## 5 · after Tune the Ladder\n-# **New** · a pop-up with three boxes (points, penalty at, rungs; blank = default). It marks the ladder **tuned**', bot.buildPenaltiesPanel(client, { note: `-# ${L.emojis.checkmark} Ladder saved. It applies from the next message; running penalties keep their end time.` }));
        controls.__reset();
        await send('## 6 · /bot freeze\n-# **New** · stop everything or chosen commands in seconds, no deploy', bot.buildFreezePanel());
        await controls.setFreeze({ all: true, reason: 'fixing a bug, back in 10 minutes' });
        await send('## 7 · frozen\n-# **New** · after Freeze Everything and its reason pop-up', bot.buildFreezePanel({ note: `-# ${L.emojis.checkmark} Everything is frozen.` }));
        await L.label('## 8 · what everyone else sees while frozen\n-# **New** · private, on any slash command, button or pop-up; typed commands go silent');
        await L.post({ content: controls.pausedLine() });
    }
    if (part === 'old') {
        await send('## 9 · /bot servers, BEFORE\n-# the rules, Reset and Delete; nothing about why Dioreo is quiet', await bot.buildServersPanel(client, GUILD));
    }
    if (part === 'b') {
        await send('## 10 · /bot servers, AFTER\n-# **New** · a checkup under the rules, and Reply Limits, Leave Server, Block Server', await bot.buildServersPanel(client, GUILD));
        await send('## 11 · Leave and Block take two presses\n-# **New** · Block = leave now, and leave again whenever re-added', await bot.buildServersPanel(client, GUILD, { armed: 'block' }));
        await send("## 12 · /bot servers with no ID\n-# **New** · the week's misfires across every server, before you open one (your pick A: Dioreo's own words only)", await bot.buildServersPicker(GUILD, 'Dioreoland'));
        // The feed: the real listeners, with the webhook post captured instead of sent.
        process.env.LOG_WEBHOOK_URL = 'https://example.invalid/hook';
        const captured = [];
        global.fetch = async (url, o) => { captured.push(JSON.parse(o.body)); return { ok: true }; };
        const handlers = {};
        const fakeClient = { on: (e, fn) => { handlers[e] = fn; }, once: () => {}, guilds: { cache: { size: 38 } }, ws: { ping: 40 } };
        require(R('bot/lifecycle')).registerLifecycle(fakeClient, []);
        handlers.guildCreate({ id: '1400000000000000002', name: 'CODM Lobby', memberCount: 1873 });
        handlers.guildDelete({ id: '1400000000000000003', name: 'Old Clan Server', memberCount: 212, available: true });
        await new Promise(r => setTimeout(r, 50));
        await L.label('## 13 · the join/leave feed, in your alerts channel\n-# **New** · one line per server Dioreo is added to or removed from; posted, never stored, never pings');
        for (const b of captured) await L.post({ embeds: b.embeds });
        const H = require(R('utils/helpPages'));
        const { PRESET_ACCENT } = require(R('commands/help'));
        await send('## 14 · /help, Bot Admin: Spam Penalties\n-# **New** page', [{ type: 17, accent_color: PRESET_ACCENT, components: H.buildPage('/bot penalties', { client, view: 'slash' }) }]);
        await send('## 15 · /help, Bot Admin: Freeze\n-# **New** page', [{ type: 17, accent_color: PRESET_ACCENT, components: H.buildPage('/bot freeze', { client, view: 'slash' }) }]);
    }
    process.exit(0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
```

## `botpage.js`

```js
// Replaces renders 14-15 with the merged /bot help page (his call, 2026-10-30 14:05 EDT).
const L = require('./lib');
const R = L.R;
(async () => {
    await L.boot();
    const m = (await L.rest.get(`/channels/${L.CHANNEL}/messages?limit=20`)).reverse();
    const i = m.findIndex(x => x.author.id === L.DEV && (x.content || '').startsWith('## 14 ·'));
    if (i >= 0) for (const x of m.slice(i)) if (x.author.id === L.DEV) await L.rest.delete(`/channels/${L.CHANNEL}/messages/${x.id}`);
    const help = require(R('commands/help'));
    const ALL = { serverAdmin: true, botAdmin: true, manage: true, bot: true, botAccess: true, autobuild: true };
    const client = { ...L.client };
    for (const [n, cmd, note] of [[14, '/bot penalties', 'opened on Spam Penalties; the dropdown under the title switches between /bot\'s six commands'], [15, '/bot freeze', 'the same page, Freeze picked']]) {
        const [card, switcher] = await help.buildHelpMessage({ perms: ALL, client, cmd, view: 'slash' });
        await L.label(`## ${n} · /help, Bot Admin: one **/bot** page\n-# **New** · ${note}`);
        await L.post({ flags: 32768, components: n === 14 ? [card, switcher] : [card] });
    }
    process.exit(0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
```
