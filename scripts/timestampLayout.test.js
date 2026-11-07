// scripts/timestampLayout.test.js -- /timestamp's panel layout (added 2026-10-20 18:24 EDT): a label above every row, Short List's six formats, the single-format view as one row, and text mode carrying the same rows. The send is stubbed, so this runs the real execute() through its overrideState path with no Discord or database.
const assert = require('assert');
const path = require('path');
const sent = [];
const stub = (rel, exportsObj) => { const f = require.resolve(path.join('..', rel)); require.cache[f] = { id: f, filename: f, loaded: true, exports: exportsObj }; };
stub('utils/sendV2Payload', { sendV2Payload: async (_i, components, opts) => { sent.push({ components, opts }); } });
stub('utils/shareButton', { withShareButton: (c) => c });
const timestamp = require('../commands/timestamp');

const U = 1792540320;
const render = async (style, isTextMode = false, ownerHasZone = false) => {
    sent.length = 0;
    await timestamp.execute({}, { unix: U, tz: 'America/Vancouver', queryInput: 'in 2 hours', style, ephemeral: false, isTextMode, accentColor: 1, ownerId: 'u1', ownerHasZone });
    return sent[0];
};
const textOf = (out) => out.opts.content || out.components[0].components.filter(c => c.type === 10).map(c => c.content).join('\n');
const codesIn = (t) => [...t.matchAll(/`<t:\d+:(\w)>`/g)].map(m => m[1]);
let failures = 0;
async function check(name, fn) { try { await fn(); console.log(`  ok   ${name}`); } catch (e) { failures++; console.error(`  FAIL ${name}\n       ${e.message}`); } }

(async () => {
    await check('the overview shows all 9 formats, each under its own label', async () => {
        const t = textOf(await render(null));
        assert.deepStrictEqual(codesIn(t), ['F', 'f', 'D', 'd', 'T', 't', 's', 'S', 'R']);
        assert.ok(t.includes('-# **FULL DATE, SHORT TIME**\n**<t:' + U + ':F>**'));
        assert.ok(t.includes('-# **RELATIVE TIME**'));
        assert.ok(t.startsWith('## ') && t.includes('Timestamp Codes'));
    });
    await check('each format is its own text box, with no blank line inside (2026-11-01 15:05 EDT, his ask)', async () => {
        const boxes = (await render(null)).components[0].components.filter(c => c.type === 10 && /`<t:\d+:\w>`/.test(c.content));
        assert.strictEqual(boxes.length, 9);
        assert.ok(boxes.every(b => codesIn(b.content).length === 1 && !b.content.includes('\n\n')));
        const all = (await render(null)).components[0].components;
        assert.ok([all, ...all.map(c => c.components || [])].flat().length < 40, 'under 40 components');
    });
    await check('Short List shows its six formats, longest first', async () => {
        assert.deepStrictEqual(codesIn(textOf(await render('short_list'))), ['F', 'f', 'D', 'd', 't', 'R']);
    });
    await check('a single format is the same panel with one row', async () => {
        assert.deepStrictEqual(codesIn(textOf(await render('longDate'))), ['D']);
    });
    await check('an unknown saved style falls back to the overview', async () => {
        assert.strictEqual(codesIn(textOf(await render('noSuchStyle'))).length, 9);
    });
    await check('the dropdown offers Short List and marks the current view', async () => {
        const out = await render('short_list');
        const select = out.components.at(-1).components[0];
        assert.strictEqual(select.options[1].value, 'short_list');
        assert.strictEqual(select.options.find(o => o.default).value, 'short_list');
    });
    await check('text mode carries the same rows and no container', async () => {
        const out = await render(null, true);
        assert.strictEqual(codesIn(out.opts.content).length, 9);
        assert.deepStrictEqual(out.components.map(c => c.components[0].type), [2, 3], 'the buttons, then the dropdown');
        assert.ok(!out.opts.content.includes('Switch views'));
    });
    await check('a user who never chose a view gets Short List; an explicit choice wins', () => {
        assert.strictEqual(timestamp.resolveStyle(null, undefined), 'short_list');
        assert.strictEqual(timestamp.resolveStyle(null, 'all_formats'), null);
        assert.strictEqual(timestamp.resolveStyle('all_formats', 'short_list'), null);
        assert.strictEqual(timestamp.resolveStyle('longDate', 'short_list'), 'longDate');
    });
    await check("his panel update (2026-11-01 15:19 EDT): no hint line, a small divider above Parsed, the buttons then the dropdown outside the panel", async () => {
        const out = await render(null);
        const [panel, buttons, menu] = out.components;
        assert.strictEqual(panel.type, 17);
        assert.ok(!textOf(out).includes('Switch views'), 'the hint line is gone');
        assert.ok(!JSON.stringify(panel).includes('tsmenu|'), 'no dropdown inside the panel');
        const inner = panel.components;
        assert.deepStrictEqual([inner.at(-2).type, inner.at(-2).spacing, inner.at(-1).content.startsWith('-# Parsed')], [14, 1, true], 'small divider, then Parsed, last');
        assert.deepStrictEqual(buttons.components.map(b => [b.label, b.style, b.custom_id]), [['Edit Timestamp', 2, 'tsedit|u1'], ['Set Timezone', 1, 'tszone|u1']]);
        assert.ok(buttons.components.every(b => b.emoji), 'both carry their emoji');
        assert.ok(menu.components[0].custom_id.startsWith('tsmenu|') && menu.components[0].placeholder === 'Switch views or pick a format');
        const saved = (await render(null, false, true)).components[1].components[1];
        assert.deepStrictEqual([saved.label, saved.style], ['My Timezone', 2], 'a saved zone: grey My Timezone');
    });
    await check('a same-day range: one code per format, the end as a time, relative shows the start', async () => {
        sent.length = 0;
        const a = 1792638000, b = a + 7200; // Wed Oct 21 8-10pm Pacific
        await timestamp.execute({}, { unix: a, endUnix: b, tz: 'America/Vancouver', queryInput: 'tomorrow 8pm to 10pm', style: null, ephemeral: false, isTextMode: false, accentColor: 1 });
        const t = textOf(sent[0]);
        assert.ok(t.includes(`\`<t:${a}:F> – <t:${b}:t>\``), 'F pairs with the end time');
        assert.ok(t.includes(`**<t:${a}:D>**`), 'a date-only format shows once on one day');
        assert.ok(t.includes('RELATIVE TIME (STARTS)') && t.includes(`\`<t:${a}:R>\``));
        const id = sent[0].components.at(-1).components[0].custom_id;
        assert.ok(id.startsWith(`tsmenu|${a}~${b}|`) && id.length <= 100, id);
    });
    await check('a range across days keeps both dates', async () => {
        sent.length = 0;
        const a = 1792771200, b = a + 3 * 86400;
        await timestamp.execute({}, { unix: a, endUnix: b, tz: 'America/Vancouver', queryInput: 'fri to mon', style: 'longDate', ephemeral: false, isTextMode: false, accentColor: 1 });
        assert.ok(textOf(sent[0]).includes(`<t:${a}:D> – <t:${b}:D>`));
    });
    process.exit(failures ? 1 : 0);
})();
