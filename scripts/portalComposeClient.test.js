// scripts/portalComposeClient.test.js
const assert = require('assert');
const { parseV2Markdown } = require('../portal/ui/v2Render.logic');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('a # line becomes an h1 line, stripped of the marker', () => {
    assert.deepStrictEqual(parseV2Markdown('# AK-47')[0], { type: 'h1', text: 'AK-47' });
});

check('a ### line becomes an h3 line', () => {
    assert.deepStrictEqual(parseV2Markdown('### Attachments')[0], { type: 'h3', text: 'Attachments' });
});

check('a -# line becomes a small/footer line', () => {
    assert.deepStrictEqual(parseV2Markdown('-# AR • Build 1 of 3')[0], { type: 'small', text: 'AR • Build 1 of 3' });
});

check('a > line becomes a blockquote line', () => {
    assert.deepStrictEqual(parseV2Markdown('> No suppressor build')[0], { type: 'blockquote', text: 'No suppressor build' });
});

check('a plain line becomes a paragraph line, and multi-line content yields one entry per line', () => {
    const lines = parseV2Markdown('### Attachments\n• `Muzzle`\n• `Barrel`');
    assert.strictEqual(lines.length, 3);
    assert.deepStrictEqual(lines[1], { type: 'p', text: '• `Muzzle`' });
});

check('a bold **word** segment inside a line is preserved as literal text (renderer bolds it, parser does not strip markers)', () => {
    assert.strictEqual(parseV2Markdown('**Fastest ADS**')[0].text, '**Fastest ADS**');
});

process.exit(failures ? 1 : 0);
