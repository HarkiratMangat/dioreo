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

check('the /help footer row: Announcements, Bugs & Suggestions and Submit a Build, each with a handler that answers it', () => {
    const row = require('../commands/help').helpFooterRow();
    assert.strictEqual(row.type, 1);
    // Submit a Build joined 2026-10-28 00:08 EDT (Harkirat); it is answered by handlers/loadouts.js's gsb~submit~ branch, `-` meaning no weapon to prefill.
    assert.deepStrictEqual(row.components.map(b => b.custom_id), ['help_announcements', fb.FEEDBACK_BUTTON_ID, 'gsb~submit~MP~-']);
    const { OWNED_PREFIXES } = require('../handlers/help');
    const loadoutPrefixes = require('../handlers/loadouts').OWNED_PREFIXES;
    row.components.forEach(b => assert.ok([...OWNED_PREFIXES, ...loadoutPrefixes].some(p => b.custom_id.startsWith(p)), b.custom_id));
    assert.ok(OWNED_PREFIXES.some(p => fb.FEEDBACK_MODAL_ID.startsWith(p)));
});

async function main() {
    // The command switcher (B6, 2026-10-30 00:15 EDT: one page per command): every option a real page, at most 25, the page shown selected, and handlers/help.js owning its ids.
    const help = require('../commands/help');
    const H = require('../utils/helpPages');
    const perms = { manage: true, botAdmin: true, serverAdmin: true, owner: true, bot: true, botAccess: true, autobuild: true };
    const client = { application: { commands: { cache: new Map() } }, user: { id: '0' } };
    {
        const [card, switcher] = await help.buildHelpMessage({ perms, client, cmd: '/colors', view: 'slash' });
        const select = switcher.components[0];
        if (select.custom_id !== 'help_command' || select.options.length > 25 || select.options.find(o => o.default)?.value !== '/colors') { failures++; console.error('  ✗ the switcher is missing, too long, or not set to /colors'); }
        else console.log(`  ✓ the switcher: ${select.options.length} options, /colors selected`);
        if (JSON.stringify(card).includes('/timestamp')) { failures++; console.error('  ✗ the /colors page names /timestamp'); }
        else console.log('  ✓ a page shows only its command');
        const owned = require('../handlers/help').OWNED_PREFIXES;
        if (!['help_command', 'help_view'].every(p => owned.includes(p))) { failures++; console.error('  ✗ handlers/help.js does not own help_command and help_view'); }
    }
    // Every /help page, with the footer row under it, as the most-privileged viewer sees it, stays inside Discord's 40 components.
    const count = (list) => { let n = 0; const walk = c => { n++; (c.components || []).forEach(walk); if (c.accessory) walk(c.accessory); }; list.forEach(walk); return n; };
    for (const [cmd, view] of [[null, 'text'], [null, 'slash'], ...help.visiblePageNames(perms).flatMap(n => (H.hasTextView(n) ? [[n, 'text'], [n, 'slash']] : [[n, 'slash']]))]) {
        let msg;
        try { msg = [...await help.buildHelpMessage({ perms, client, cmd, view }), help.helpFooterRow()]; }
        catch (e) { failures++; console.error(`  ✗ /help ${cmd || 'home'} ${view} would not build: ${e.message}`); continue; }
        const n = count(msg);
        if (n > 40) { failures++; console.error(`  ✗ /help ${cmd || 'home'} ${view} is ${n} components with the footer row`); }
    }
    console.log('  ✓ every /help page fits 40 components with the footer row');
    process.exit(failures ? 1 : 0);
}
main();
