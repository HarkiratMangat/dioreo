// scripts/webhookAuth.test.js Every raw call on an INTERACTION webhook route (Routes.webhook / Routes.webhookMessage with an interaction token) must send `auth: false`. Why (2026-11-21 11:45 EST): with the bot token attached, a 401 for an expired interaction token ("Invalid Webhook Token") reads to @discordjs/rest as a bad BOT token, and it calls setToken(null) on the whole client. On prod that morning one idle panel's expiry edit did exactly that, and every panel reply after it failed with "Expected token to be set for this request, but none was present" until a restart (Harkirat's /timestamp in a DM was the first report; the DM had nothing to do with it). Two halves: a source scan so a new call site cannot forget it, and the two hot paths (sendV2Payload, passive expiry) run with a fake REST that records what was sent.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', 'public', '.git', 'local', 'docs', 'portal', 'scripts', '.claude', 'Logos-&-Emojis', 'coverage']);

function jsFiles(dir) {
    const out = [];
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ent.isDirectory()) { if (!SKIP_DIRS.has(ent.name)) out.push(...jsFiles(path.join(dir, ent.name))); }
        else if (ent.name.endsWith('.js')) out.push(path.join(dir, ent.name));
    }
    return out;
}

// 1. Source scan. Each `Routes.webhook…(` in code (not in a comment line) needs an `auth:` key within the call it sits in; 700 characters covers every current site with room, and a site that names its route in a variable (passiveExpiry) still has the key right below it.
const offenders = [];
let sites = 0;
for (const file of jsFiles(ROOT)) {
    const src = fs.readFileSync(file, 'utf8');
    // A hand-written `/webhooks/` route string counts too, so a raw path cannot slip past the Routes check.
    const re = /Routes\.webhook(Message)?\(|[`'"]\/webhooks\//g;
    let m;
    while ((m = re.exec(src))) {
        const lineStart = src.lastIndexOf('\n', m.index) + 1;
        if (/^\s*(\/\/|\*)/.test(src.slice(lineStart, m.index))) continue; // a mention in a comment
        sites++;
        if (!/\bauth:\s*/.test(src.slice(m.index, m.index + 700))) offenders.push(`${path.relative(ROOT, file)}:${src.slice(0, m.index).split('\n').length}`);
    }
}
assert.ok(sites >= 5, `expected at least 5 interaction-webhook call sites, found ${sites} (did the scan break?)`);
assert.deepStrictEqual(offenders, [], `raw interaction-webhook calls without auth: false:\n  ${offenders.join('\n  ')}`);
console.log(`ok: ${sites} interaction-webhook call sites all set auth`);

(async () => {
    // 2. sendV2Payload: the PATCH to @original carries auth: false.
    const { sendV2Payload } = require('../utils/sendV2Payload');
    const calls = [];
    const fakeClient = { rest: { patch: async (route, opts) => { calls.push({ route, opts }); return { id: '1' }; } } };
    const interaction = { client: fakeClient, applicationId: 'app', token: 'tok', deferred: true, replied: false };
    await sendV2Payload(interaction, [{ type: 17, components: [{ type: 10, content: 'hi' }] }], { skipExpiry: true });
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].route, require('discord.js').Routes.webhookMessage('app', 'tok', '@original'));
    assert.strictEqual(calls[0].opts.auth, false, 'sendV2Payload must send auth: false');
    assert.ok(calls[0].opts.body, 'the body still goes out');
    assert.strictEqual(interaction.__dioreoAnswered, true, 'a delivered answer is marked, so a later failure follows up instead of overwriting it');
    console.log('ok: sendV2Payload sends auth: false');

    // 3. Passive expiry: the webhook edit sends auth: false; a text command's channel-message edit keeps the bot token.
    const { schedulePanelExpiry } = require('../utils/passiveExpiry');
    const panel = [{ type: 1, components: [{ type: 2, style: 2, label: 'x', custom_id: 'x' }] }];
    const seen = [];
    const client = { rest: { patch: async (route, opts) => { seen.push({ route, opts }); } } };
    schedulePanelExpiry({ client, applicationId: 'app', token: 'tok' }, 'm1', panel, 1);
    schedulePanelExpiry({ client, applicationId: 'app', token: null, __dioreoText: true, channelId: 'c1' }, 'm2', panel, 1);
    await new Promise(r => setTimeout(r, 30));
    const hook = seen.find(c => c.route.startsWith('/webhooks/'));
    const chan = seen.find(c => c.route.startsWith('/channels/'));
    assert.ok(hook && chan, `both expiries fired: ${JSON.stringify(seen.map(c => c.route))}`);
    assert.strictEqual(hook.opts.auth, false, 'the webhook expiry edit must send auth: false');
    assert.strictEqual(chan.opts.auth, true, "a text command's channel edit needs the bot token");
    console.log('ok: passive expiry sends auth: false on the webhook edit only');
})().catch(err => { console.error(err); process.exit(1); });
