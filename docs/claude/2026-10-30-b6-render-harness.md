---
kind: record
status: frozen
---

# B6's render harness for #testing-spam

*Written 2026-10-30 02:50 EDT by B6's session. B6 designed every text-command message and /help page with Harkirat by posting renders to #testing-spam (`1536403911676792892`) as the dev bot, one item at a time. The harness lived in that cloud container's scratchpad; this copy is for B7, whose plan says to render "the way B6 did".*

## How it works

- It builds each message with the repo's real code (`bot/textCommands.js` `onMessage` through a fake message, or a page builder such as `utils/helpPages.js`) and posts the body to the channel with discord.js's `REST`.
- **The token:** in the cloud container, the environment's proxy injects the dev bot's token for discord.com, so the script calls `setToken('dummy')`. On the Mac there is no proxy: pass the token from `.env.dev` (`BOT_TOKEN`) to `setToken`, and drop the `undici` proxy lines.
- **Stubs** keep it off Mongo and Discord's command permissions: `utils/textCommands/permissions`, `handlers/router`, `utils/guildPolicy`, `utils/eventStore`, `utils/userStats`, `utils/autocomplete` (a fixed weapon and season list).
- **Posting:** `label(text)` posts a small `-#` line naming what follows, then `post(body)` the card; `clean(body)` drops the reply reference and sets no allowed mentions.
- **Cleaning up:** `clean.js <message id>` deletes every dev-bot post after that id (others' messages are kept); `delLabels.js '<regex>'` deletes matching labels and the card after each.
- ⚠️ **`process.env.TEXT_PREFIXES = '/,d,dior'` is stale.** B6 removed `/`; set `'d,dior'` (or the server's own prefixes once B7 adds them).
- A mock that the code can't produce yet (an option to pick between) is a script that requires `lib.js` and posts a hand-built Components V2 body; B6's draft of the /admin help page is in the text-commands plan's B7 spec section.

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
stub('utils/guildPolicy', { attachGuildPolicy: async () => null });
stub('utils/eventStore', { recordInteractionEvent() {} });
stub('utils/userStats', { noteOwnCommandSafely() {} });
const WEAPONS = [{ name: '[AR] AK117', value: 'ak117' }, { name: '[AR] AK-47', value: 'ak47' }];
const SEASONS = [{ name: 'Season 9: Haunted', value: 'id9' }, { name: 'Season 8: Terminated', value: 'id8' }, { name: 'Season 7: Monster Hunt', value: 'id7' }];
stub('utils/autocomplete', { runAutocomplete: async i => i.respond(i.commandName === 'patch' ? SEASONS : WEAPONS) });
process.env.TEXT_PREFIXES = '/,d,dior';
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

## `clean.js`

```js
// Deletes every message the dev bot posted in #testing-spam after a given id.
const L = require('./lib');
(async () => {
    const after = process.argv[2];
    const msgs = await L.rest.get(`/channels/${L.CHANNEL}/messages?limit=100&after=${after}`);
    const mine = msgs.filter(m => m.author.id === L.DEV);
    for (const m of mine) await L.rest.delete(`/channels/${L.CHANNEL}/messages/${m.id}`);
    console.log('deleted', mine.length, 'kept others', msgs.length - mine.length);
})().catch(e => { console.error(e.message); process.exit(1); });
```

## `delLabels.js`

```js
// Deletes the dev bot's label posts whose text matches argv[2] (a regex) and the card posted right after each.
const L = require('./lib');
(async () => {
  const re = new RegExp(process.argv[2]);
  const m = (await L.rest.get(`/channels/${L.CHANNEL}/messages?limit=40`)).reverse();
  let n = 0;
  for (let i = 0; i < m.length; i++) if (m[i].author.id === L.DEV && re.test(m[i].content || '')) {
    await L.rest.delete(`/channels/${L.CHANNEL}/messages/${m[i].id}`); n++;
    if (m[i + 1] && m[i + 1].author.id === L.DEV && !m[i + 1].content) { await L.rest.delete(`/channels/${L.CHANNEL}/messages/${m[i + 1].id}`); n++; }
  }
  console.log('deleted', n);
})().catch(e => { console.error(e.message); process.exit(1); });
```
