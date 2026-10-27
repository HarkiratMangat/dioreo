// scripts/feedback.test.js -- /help's Bugs & Suggestions (utils/feedback.js, 2026-10-27 01:24 EDT): the pop-up Discord accepts, the owner's DM card, the 10-minute limit, and the /help landing's footer row.
const assert = require('assert');
const fb = require('../utils/feedback');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('the pop-up: three labelled parts, a required kind and message, an optional screenshot', () => {
    const m = fb.feedbackModal();
    assert.strictEqual(m.custom_id, fb.FEEDBACK_MODAL_ID);
    assert.ok(m.title.length <= 45);
    const parts = m.components.map(c => c.component);
    assert.deepStrictEqual(parts.map(p => p.type), [3, 4, 19]);
    assert.strictEqual(parts[0].required, true);
    assert.deepStrictEqual(parts[0].options.map(o => o.value), ['bug', 'feedback', 'idea']);
    assert.strictEqual(parts[1].required, true);
    assert.strictEqual(parts[2].required, false);
    m.components.forEach(c => assert.ok(c.label.length <= 45));
});

check('the owner card says what it is, who sent it and when, and quotes every line', () => {
    const [c] = fb.feedbackCard({ kind: 'bug', message: 'line one\nline two', userId: '42', username: 'someone', sentAt: new Date(0) });
    assert.strictEqual(c.type, 17);
    assert.ok(c.components[0].content.startsWith('## Bug report'));
    assert.ok(c.components[0].content.includes('<@42>') && c.components[0].content.includes('`someone`') && c.components[0].content.includes('<t:0:R>'));
    assert.strictEqual(c.components[2].content, '> line one\n> line two');
    assert.ok(!c.components.some(x => x.type === 12), 'no gallery without a screenshot');
    const [withShot] = fb.feedbackCard({ kind: 'idea', message: 'x', userId: '1', username: 'u' }, 'attachment://shot.png');
    assert.deepStrictEqual(withShot.components.at(-1), { type: 12, items: [{ media: { url: 'attachment://shot.png' } }] });
});

check('one note every 10 minutes per person', () => {
    fb._lastSent.set('u1', 1000);
    assert.ok(fb.waitUntil('u1', 1000 + 60000));
    assert.strictEqual(fb.waitUntil('u1', 1000 + fb.RATE_MS), null);
    assert.strictEqual(fb.waitUntil('nobody', 5000), null);
});

check('the /help footer row: Announcements and Bugs & Suggestions, ids /help answers', () => {
    const row = require('../commands/help').helpFooterRow();
    assert.strictEqual(row.type, 1);
    assert.deepStrictEqual(row.components.map(b => b.custom_id), ['help_announcements', fb.FEEDBACK_BUTTON_ID]);
    const { OWNED_PREFIXES } = require('../handlers/help');
    row.components.forEach(b => assert.ok(OWNED_PREFIXES.some(p => b.custom_id.startsWith(p)), b.custom_id));
    assert.ok(OWNED_PREFIXES.some(p => fb.FEEDBACK_MODAL_ID.startsWith(p)));
});

async function main() {
    // The one-command dropdown: every option is a real command page, at most 25, and picking one shows only that command.
    {
        const help = require('../commands/help');
        const perms = { manage: true, botAdmin: true, serverAdmin: true, owner: true, bot: true, botAccess: true };
        const client = { application: { commands: { cache: new Map() } }, user: { id: '0' } };
        const page = await help.buildContainer('utilities', 0, perms, client, '/colors', true);
        const rows = page.components.filter(c => c.type === 1).map(r => r.components[0]);
        const cmdSelect = rows.find(s => s.custom_id === 'help_command');
        if (!cmdSelect || cmdSelect.options.length > 25 || cmdSelect.options.find(o => o.default)?.value !== '/colors') { failures++; console.error('  ✗ the one-command dropdown is missing, too long, or not set to /colors'); }
        else console.log(`  ✓ the one-command dropdown: ${cmdSelect.options.length} commands, /colors selected`);
        const blocks = page.components.filter(c => c.type === 10).map(c => c.content).join('\n');
        if (/### `\/timestamp`/.test(blocks)) { failures++; console.error('  ✗ the /colors page still shows /timestamp'); }
        else console.log('  ✓ the one-command page shows only that command');
        if (!require('../handlers/help').OWNED_PREFIXES.includes('help_command')) { failures++; console.error('  ✗ handlers/help.js does not own help_command'); }
    }
    // Every /help page, with the footer row under it, as the most-privileged viewer sees it (the longest pages), stays inside Discord's 40 components.
    const help = require('../commands/help');
    const count = (list) => { let n = 0; const walk = c => { n++; (c.components || []).forEach(walk); if (c.accessory) walk(c.accessory); }; list.forEach(walk); return n; };
    const perms = { manage: true, botAdmin: true, serverAdmin: true, owner: true };
    const client = { application: { commands: { cache: new Map() } }, user: { id: '0' } };
    for (const key of [null, ...help.CATEGORY_DEFS.map(c => c.key)]) {
        let msg;
        try { msg = [await help.buildContainer(key, 0, perms, client, null), help.helpFooterRow()]; }
        catch (e) { failures++; console.error(`  ✗ /help page ${key || 'landing'} would not build: ${e.message}`); continue; }
        const n = count(msg);
        if (n > 40) { failures++; console.error(`  ✗ /help page ${key || 'landing'} is ${n} components with the footer row`); }
        else console.log(`  ✓ /help page ${key || 'landing'}: ${n} components with the footer row`);
    }
    process.exit(failures ? 1 : 0);
}
main();
