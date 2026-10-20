// scripts/timestampLayout.test.js -- /timestamp's panel layout (added 2026-10-20 18:24 EDT): a label above every row, Short List's six formats, the single-format view as one row, and text mode carrying the same rows. The send is stubbed, so this runs the real execute() through its overrideState path with no Discord or database.
const assert = require('assert');
const path = require('path');
const sent = [];
const stub = (rel, exportsObj) => { const f = require.resolve(path.join('..', rel)); require.cache[f] = { id: f, filename: f, loaded: true, exports: exportsObj }; };
stub('utils/sendV2Payload', { sendV2Payload: async (_i, components, opts) => { sent.push({ components, opts }); } });
stub('utils/shareButton', { withShareButton: (c) => c });
const timestamp = require('../commands/timestamp');

const U = 1792540320;
const render = async (style, isTextMode = false) => {
    sent.length = 0;
    await timestamp.execute({}, { unix: U, tz: 'America/Vancouver', queryInput: 'in 2 hours', style, ephemeral: false, isTextMode, accentColor: 1 });
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
        const select = out.components[0].components.at(-1).components[0];
        assert.strictEqual(select.options[1].value, 'short_list');
        assert.strictEqual(select.options.find(o => o.default).value, 'short_list');
    });
    await check('text mode carries the same rows and no container', async () => {
        const out = await render(null, true);
        assert.strictEqual(codesIn(out.opts.content).length, 9);
        assert.strictEqual(out.components[0].type, 1);
    });
    await check('a user who never chose a view gets Short List; an explicit choice wins', () => {
        assert.strictEqual(timestamp.resolveStyle(null, undefined), 'short_list');
        assert.strictEqual(timestamp.resolveStyle(null, 'all_formats'), null);
        assert.strictEqual(timestamp.resolveStyle('all_formats', 'short_list'), null);
        assert.strictEqual(timestamp.resolveStyle('longDate', 'short_list'), 'longDate');
    });
    await check('the hint line reads "Switch views or pick a format"', async () => {
        assert.ok(textOf(await render(null)).includes('-# Switch views or pick a format'));
    });
    process.exit(failures ? 1 : 0);
})();
