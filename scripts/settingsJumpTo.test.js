// scripts/settingsJumpTo.test.js
//
// `/settings open:` (2026-10-19 17:52 EDT, named `customize:` until 2026-10-19 19:33 EDT; docs/ROADMAP.md's "/settings jump-to options"): Visibility lands on page 1, Preferences on page 2, Colors opens the View Colors panel through /colors' own execute() under settingsVisibility. The database, the accent lookup and the Discord send are stubbed through require.cache so the real commands/settings.js runs end to end with no connection; the assertions read the payload it would have sent.
const assert = require('assert');
const path = require('path');
const Module = require('module');

let failed = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (err) { failed++; console.log(`  ✗ ${name}\n      ${err.message.split('\n').join('\n      ')}`); }
}

function stub(rel, exports) {
    const file = path.join(__dirname, '..', rel);
    const m = new Module(file, null);
    m.filename = file;
    m.loaded = true;
    m.exports = exports;
    require.cache[file] = m;
}

const sent = [];
const colorsCalls = [];
stub('models/UserPreference.js', Object.assign(function UserPreference(d) { Object.assign(this, d); this.save = async () => this; }, {
    findOne: async ({ discordId }) => ({ discordId, settingsVisibility: 'private', colorsVisibility: 'public', save: async () => {} })
}));
stub('utils/accentColor.js', {
    resolveAccentColor: async () => 0x123456,
    fetchDisplayNameColors: async () => null,
    resolveDynamicProfileColor: async () => 0x123456,
    resolveGuildNameColors: async () => null
});
stub('utils/sendV2Payload.js', { sendV2Payload: async (interaction, components, opts) => { sent.push({ components, opts }); } });
stub('commands/colors.js', { execute: async (interaction, opts) => { colorsCalls.push(opts); } });

const settings = require('../commands/settings');

function fakeInteraction({ open = null, slash = true } = {}) {
    const user = {
        id: '42', username: 'tester', createdAt: new Date('2020-01-01T00:00:00Z'),
        displayAvatarURL: () => 'https://cdn.discordapp.com/avatars/42/a.png'
    };
    return {
        user, member: null, guildId: null,
        deferred: false, replied: false,
        isChatInputCommand: () => slash,
        options: { getString: (name) => (name === 'open' ? open : null) },
        deferReply: async function () { this.deferred = true; },
        client: { users: { fetch: async () => ({ bannerURL: () => null }) } }
    };
}

// Everything the panel shows as text, flattened, so a page is identified by its heading rather than by component positions that move whenever the layout does.
function textOf(components) {
    const out = [];
    const walk = (c) => {
        if (!c || typeof c !== 'object') return;
        if (c.type === 10 && c.content) out.push(c.content);
        for (const k of ['components', 'accessory']) {
            const v = c[k];
            if (Array.isArray(v)) v.forEach(walk); else if (v) walk(v);
        }
    };
    components.forEach(walk);
    return out.join('\n');
}

(async () => {
    await check('the option is registered before `visibility`, with the three roadmap choices plus Your Stats', () => {
        const opts = settings.data.toJSON().options;
        assert.deepStrictEqual(opts.map(o => o.name), ['open', 'visibility']);
        assert.deepStrictEqual(opts[0].choices.map(c => c.value), ['visibility', 'preferences', 'colors', 'stats']);
        assert.ok(!opts[0].required, 'open is optional');
    });

    await check('open:preferences lands on page 2 even though the page argument says page 1', async () => {
        sent.length = 0;
        await settings.execute(fakeInteraction({ open: 'preferences' }), 0);
        const text = textOf(sent[0].components);
        assert.ok(text.includes('Default Preferences'), 'the Preferences heading renders');
        assert.ok(!text.includes('Default Visibility'), 'the Visibility page does not');
    });

    await check('open:visibility lands on page 1', async () => {
        sent.length = 0;
        await settings.execute(fakeInteraction({ open: 'visibility' }), 1);
        assert.ok(textOf(sent[0].components).includes('Default Visibility'));
    });

    await check('no option keeps the old behaviour: page 1, and a button re-render keeps its own page', async () => {
        sent.length = 0;
        await settings.execute(fakeInteraction(), 0);
        assert.ok(textOf(sent[0].components).includes('Default Visibility'));
        // A set_page_ click arrives as a button: isChatInputCommand() is false, so `open` is never read, and the page the handler asked for is the one drawn.
        const button = fakeInteraction({ open: 'visibility', slash: false });
        await settings.execute(button, 1);
        assert.ok(textOf(sent[1].components).includes('Default Preferences'), 'a re-render is not hijacked by the option');
    });

    await check('open:colors opens /colors under settingsVisibility, the same field the dashboard button reads, and draws no dashboard', async () => {
        sent.length = 0; colorsCalls.length = 0;
        await settings.execute(fakeInteraction({ open: 'colors' }), 0);
        assert.deepStrictEqual(colorsCalls, [{ prefsField: 'settingsVisibility' }]);
        assert.strictEqual(sent.length, 0, 'the settings dashboard itself is not sent');
    });

    if (failed) { console.log(`\n${failed} check(s) failed.`); process.exit(1); }
    console.log('\nAll /settings jump-to checks passed.');
})();
