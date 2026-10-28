// scripts/helpSearch.test.js -- /help's `cmd:` search finds commands by the everyday words a confused person types (utils/helpSearch.js; Harkirat, 2026-10-25 23:05 EDT, with his own examples: "weapon", "create", "profile", "right", "app"), lists /gunsmith mp and /gunsmith dmz rather than bare /gunsmith, and never shows a command its reader cannot use.
const assert = require('assert');
const help = require('../commands/help');

const OWNER = { serverAdmin: true, botAdmin: true, manage: true, bot: true, botAccess: true, autobuild: true };
const NOBODY = {};
let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}
const names = async (q, perms) => (await help.helpChoices(q, perms)).map(c => c.value);
const hasAll = (got, want, q) => { for (const w of want) assert.ok(got.includes(w), `"${q}" should find ${w}; got ${got.join(', ')}`); };

(async () => {
    await check('his examples find what he expected', async () => {
        hasAll(await names('weapon', OWNER), ['/gunsmith mp', '/gunsmith dmz', '/autobuild'], 'weapon');
        hasAll(await names('create', OWNER), ['/colors', '/timestamp'], 'create');
        hasAll(await names('profile', NOBODY), ['/settings', '/colors'], 'profile');
        hasAll(await names('right', NOBODY), ['View Colors', 'Convert Times'], 'right');
        hasAll(await names('app', NOBODY), ['/invite', 'View Colors'], 'app');
    });
    await check('the obvious command comes first', async () => {
        for (const [q, first] of [['time', '/timestamp'], ['tmestamp', '/timestamp'], ['nerf', '/patch notes'], ['remind me', '/remind'], ['cp', '/draw prices'], ['how do i change my timezone', '/settings'], ['when does the season end', '/season end'], ['hide my responses', '/settings']]) {
            assert.strictEqual((await names(q, NOBODY))[0], first, q);
        }
    });
    await check('/gunsmith is listed as its two subcommands, and bare /gunsmith still opens its page', async () => {
        const all = await names('', NOBODY);
        assert.ok(all.includes('/gunsmith mp') && all.includes('/gunsmith dmz') && !all.includes('/gunsmith'));
        assert.strictEqual(await help.resolveCommandToCategory('/gunsmith', NOBODY), 'gunsmith');
        assert.strictEqual(await help.resolveCommandToCategory('/gunsmith dmz', NOBODY), 'gunsmith');
    });
    await check('a reader never sees what they cannot use', async () => {
        const w = await names('weapon', NOBODY);
        assert.ok(!w.includes('/autobuild') && !w.includes('Autobuild Gunsmith'), w.join(', '));
        const all = await names('', NOBODY);
        for (const admin of ['/manage', '/manage emojis', '/bot analytics', '/admin', 'Add to Calendar']) assert.ok(!all.includes(admin), admin);
        assert.ok((await names('emo', OWNER)).includes('/manage emojis'), 'the owner finds /manage emojis');
    });
    await check('nonsense finds nothing; every suggestion fits Discord and names its job', async () => {
        assert.deepStrictEqual(await names('xyzzy', OWNER), []);
        // Just the name (his 23:17 EDT call: a line after each was overwhelming).
        for (const c of await help.helpChoices('', OWNER)) assert.ok(c.name === c.value && c.name.length <= 100, c.name);
    });
    await check('a typed word opens the right page and puts its command first', async () => {
        assert.strictEqual(await help.resolveCommandToCategory('profile', NOBODY), 'utilities');
        assert.strictEqual(await help.matchHelpCommand('tmestamp', NOBODY), '/timestamp');
        assert.strictEqual(await help.matchHelpCommand('View Colors', NOBODY), null, 'a right-click app is not a command block');
    });

    if (failures) { console.error(`\n${failures} check(s) failed.`); process.exit(1); }
    console.log('\nhelpSearch: all checks passed.');
    process.exit(0);
})();
