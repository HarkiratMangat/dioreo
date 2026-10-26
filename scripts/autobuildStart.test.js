// scripts/autobuildStart.test.js -- the form a bare /autobuild opens (utils/autobuildStart.js, Harkirat's /autobuild review, 2026-10-25 11:40-12:03 EDT): its four fields, the presets ("1. mp, lmg"; a link's preset after the link), and the plan it hands the batch. No Discord, no Vertex, no database. Run: `node scripts/autobuildStart.test.js` (also via `npm test`).
const assert = require('assert');
const { buildStartModal, parsePreset, parseLinks, parsePresetLines, planStart, presetWarning } = require('../utils/autobuildStart');
const { ModalBuilder } = require('discord.js');

let passed = 0, failed = 0;
function t(name, fn) {
    try { fn(); passed++; console.log(`  PASS  ${name}`); } catch (err) { failed++; console.log(`  FAIL  ${name}\n        ${err.message}`); }
}

console.log('\n/autobuild — the start form\n');

t('the form has its four fields, files first, and discord.js accepts it', () => {
    const m = buildStartModal();
    assert.deepStrictEqual(m.components.map(c => c.label), ['Screenshots', 'Links', 'Screenshot presets', 'Retry token']);
    assert.strictEqual(m.components[0].component.type, 19, 'the screenshots field is not a file upload');
    assert.strictEqual(m.components[0].component.max_values, 10);
    assert.ok(m.title.length <= 45);
    for (const c of m.components) {
        assert.ok(c.label.length <= 45 && (c.description || '').length <= 100, `${c.label}: over Discord's limits`);
        assert.ok((c.component.placeholder || '').length <= 100, `${c.label}: placeholder over 100 characters`);
    }
    new ModalBuilder(m).toJSON();
});

t('the Re-upload button\'s form arrives with the retry token filled in', () => {
    assert.strictEqual(buildStartModal('abc123').components[3].component.value, 'abc123');
    assert.strictEqual(buildStartModal().components[3].component.value, undefined);
});

t('a preset sets only what it names, in any order, with any separator', () => {
    assert.deepStrictEqual(parsePreset('mp, lmg'), { mode: 'MP', category: 'LMG', badges: [], unknown: [] });
    assert.deepStrictEqual(parsePreset('meta/best'), { mode: null, category: null, badges: ['meta', 'best'], unknown: [] });
    for (const s of ['meta, best', 'meta/best', 'meta,best', 'best meta']) {
        assert.deepStrictEqual(parsePreset(s).badges.sort(), ['best', 'meta'], s);
    }
    assert.deepStrictEqual(parsePreset('smg meta/toxic/best dmz'), { mode: 'DMZ', category: 'SMG', badges: ['meta', 'toxic', 'best'], unknown: [] });
});

t('two-word class names survive spaces as separators, and badges are never read as classes', () => {
    assert.strictEqual(parsePreset('mp, assault rifle, meta').category, 'AR');
    assert.strictEqual(parsePreset('light machine gun').category, 'LMG');
    assert.strictEqual(parsePreset('marksman rifle').category, 'MARKSMAN');
    // "ass" begins "assault": it must stay a badge.
    assert.deepStrictEqual([parsePreset('ass').category, parsePreset('ass').badges], [null, ['ass']]);
    assert.deepStrictEqual(parsePreset('top 5').badges, ['top5']);
    assert.deepStrictEqual(parsePreset('hp, s&d').badges, ['hp', 's&d']);
    assert.strictEqual(parsePreset('snipe').category, 'SNIPER', 'a class typed short still counts');
});

t('a word nothing recognises is kept, never dropped, and the review page says so', () => {
    const p = parsePreset('mp, ar, bset');
    assert.deepStrictEqual(p.unknown, ['bset']);
    assert.ok(/bset/.test(presetWarning(p)));
    assert.strictEqual(presetWarning(parsePreset('mp, ar')), null);
    assert.deepStrictEqual(parsePreset('rifle').unknown, ['rifle'], 'a word naming three classes is not a guess');
});

t('links carry their preset on the same line; a line that is not a link is reported', () => {
    const { links, problems } = parseLinks('https://a.example/1.png mp, sniper\nhttps://a.example/2.png\nhttps://a.example/3.png, meta/best\nnot a link');
    assert.deepStrictEqual(links.map(l => l.url), ['https://a.example/1.png', 'https://a.example/2.png', 'https://a.example/3.png']);
    assert.strictEqual(links[0].preset.category, 'SNIPER');
    assert.strictEqual(links[1].preset, null);
    assert.deepStrictEqual(links[2].preset.badges, ['meta', 'best']);
    assert.strictEqual(problems.length, 1);
});

t('screenshot presets are keyed by number, in his format and its near variants', () => {
    const { byNumber, problems } = parsePresetLines('1. mp, lmg\n4. dmz, ar\n5) mp, smg, meta/toxic/best\n#7 sniper\nno number');
    assert.deepStrictEqual([...byNumber.keys()], [1, 4, 5, 7]);
    assert.strictEqual(byNumber.get(4).mode, 'DMZ');
    assert.deepStrictEqual(byNumber.get(5).badges, ['meta', 'toxic', 'best']);
    assert.strictEqual(problems.length, 1);
});

t('the plan: uploads then links, each with its preset and a label naming its file; a preset with no screenshot becomes a note', () => {
    const { images, notes } = planStart({
        files: [{ url: 'u1', name: 'IMG_1.png' }, { url: 'u2', name: 'IMG_2.png' }],
        linksText: 'https://x.example/a.png dmz',
        presetsText: '2. smg\n9. ar',
    });
    assert.deepStrictEqual(images.map(i => i.url), ['u1', 'u2', 'https://x.example/a.png']);
    assert.strictEqual(images[0].preset, null);
    assert.strictEqual(images[1].preset.category, 'SMG');
    assert.strictEqual(images[2].preset.mode, 'DMZ');
    assert.ok(/IMG_2\.png/.test(images[1].label) && /#2/.test(images[1].label));
    assert.strictEqual(notes.length, 1);
    assert.ok(/#9/.test(notes[0]));
});

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
