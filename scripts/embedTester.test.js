// scripts/embedTester.test.js — utils/embedTester.js (the dev-only /embedtest) and its dev-only registration. Run: node scripts/embedTester.test.js
const assert = require('assert');
const path = require('path');
const t = require('../utils/embedTester');

let failed = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); } catch (err) { failed++; console.error(`  ✗ ${name}\n    ${err.message}`); }
}

// Two fake application emojis with dev-shaped ids, one animated.
const APP = [
    { id: '111111111111111111', name: 'DrawCalc', animated: true },
    { id: '222222222222222222', name: '5Legendary_CODM', animated: false },
    { id: '333333333333333333', name: 'cp', animated: false },
    { id: '444444444444444444', name: 'CP', animated: false },
];
const index = t.buildEmojiIndex(APP);

// Harkirat's own example, trimmed to what matters here.
const EXAMPLE = {
    flags: 36864,
    components: [{ type: 17, components: [
        { type: 10, content: '## <a:DrawCalc:111111111111111111> Lucky Draw Cost Calculator' },
        { type: 14, spacing: 1, divider: true },
        { type: 10, content: '<:5Legendary_CODM:999999999999999999> #1 · `0/10` Spins' },
    ] }],
};

console.log('parseInput');
check('strips a ```json fence', () => {
    assert.deepStrictEqual(t.parseInput('```json\n{"a":1}\n```').value, { a: 1 });
});
check('points at where invalid JSON broke', () => {
    const r = t.parseInput('{"a": 1,, "b": 2}');
    assert.ok(r.error && r.error.includes('⟪here⟫'), r.error);
});
check('empty input is an error, not a crash', () => {
    assert.ok(t.parseInput('   ').error);
});

console.log('normalizePayload');
check('his example: V2 on, notifications bit dropped, public', () => {
    const m = t.normalizePayload(structuredClone(EXAMPLE));
    assert.strictEqual(m.isV2, true);
    assert.strictEqual(m.sendFlags, 32768);
    assert.strictEqual(m.ephemeral, false);
});
check('a bare components array is a message', () => {
    const m = t.normalizePayload([{ type: 10, content: 'hi' }]);
    assert.strictEqual(m.components.length, 1);
    assert.strictEqual(m.isV2, true);
});
check('a lone container is wrapped as the only component', () => {
    const m = t.normalizePayload({ type: 17, components: [{ type: 10, content: 'hi' }] });
    assert.strictEqual(m.components.length, 1);
    assert.strictEqual(m.components[0].type, 17);
});
check('V2 components without the V2 flag still send as V2', () => {
    assert.strictEqual(t.normalizePayload({ components: [{ type: 10, content: 'x' }] }).sendFlags & 32768, 32768);
});
check('a classic action row alone stays classic', () => {
    const m = t.normalizePayload({ content: 'hi', components: [{ type: 1, components: [{ type: 2, style: 1, label: 'x', custom_id: 'a' }] }] });
    assert.strictEqual(m.isV2, false);
    assert.strictEqual(m.sendFlags, 0);
});
check('ephemeral bit and suppress-embeds are read', () => {
    const m = t.normalizePayload({ flags: 32768 | 64 | 4, components: [{ type: 10, content: 'x' }] });
    assert.strictEqual(m.ephemeral, true);
    assert.strictEqual(m.sendFlags, 32768 | 4);
});
check('V2 plus content is refused with a reason', () => {
    assert.ok(t.normalizePayload({ flags: 32768, content: 'x', components: [{ type: 10, content: 'y' }] }).error);
});
check('a payload with nothing in it is refused', () => {
    assert.ok(t.normalizePayload({ flags: 32768 }).error);
});

console.log('resolveEmojis');
check('own id kept, foreign id swapped by name', () => {
    const m = t.normalizePayload(structuredClone(EXAMPLE));
    const r = t.resolveEmojis(m, index);
    const texts = m.components[0].components.filter(c => c.type === 10).map(c => c.content);
    assert.ok(texts[0].includes('<a:DrawCalc:111111111111111111>'), texts[0]);
    assert.ok(texts[1].includes('<:5Legendary_CODM:222222222222222222>'), texts[1]);
    assert.deepStrictEqual(r.remapped, ['5Legendary_CODM']);
    assert.deepStrictEqual(r.unresolved, []);
});
check('bare :name: resolves, and to the animated form', () => {
    const m = t.normalizePayload([{ type: 10, content: 'go :DrawCalc: now' }]);
    t.resolveEmojis(m, index);
    assert.strictEqual(m.components[0].content, 'go <a:DrawCalc:111111111111111111> now');
});
check('a static mention of an animated emoji is corrected', () => {
    const m = t.normalizePayload([{ type: 10, content: '<:DrawCalc:111111111111111111>' }]);
    const r = t.resolveEmojis(m, index);
    assert.strictEqual(m.components[0].content, '<a:DrawCalc:111111111111111111>');
    assert.deepStrictEqual(r.fixed, ['DrawCalc']);
});
check('a unique case-insensitive name resolves; an ambiguous one does not', () => {
    const m = t.normalizePayload([{ type: 10, content: ':drawcalc: :Cp:' }]);
    const r = t.resolveEmojis(m, index);
    assert.ok(m.components[0].content.startsWith('<a:DrawCalc:111111111111111111>'), m.components[0].content);
    assert.ok(m.components[0].content.endsWith(':Cp:'), m.components[0].content);
    assert.deepStrictEqual(r.unresolved, ['Cp']);
});
check('timestamps and clock times are left alone and not reported', () => {
    const text = 'Ends <t:1700000000:R> at 12:30:45';
    const m = t.normalizePayload([{ type: 10, content: text }]);
    const r = t.resolveEmojis(m, index);
    assert.strictEqual(m.components[0].content, text);
    assert.deepStrictEqual(r.unresolved, []);
});
check('an unknown :name: is left as written and reported', () => {
    const m = t.normalizePayload([{ type: 10, content: 'hot :fire:' }]);
    const r = t.resolveEmojis(m, index);
    assert.strictEqual(m.components[0].content, 'hot :fire:');
    assert.deepStrictEqual(r.unresolved, ['fire']);
});
check('button and select-option emoji fields resolve from any written form', () => {
    const m = t.normalizePayload([{ type: 1, components: [
        { type: 2, style: 1, label: 'a', emoji: ':DrawCalc:' },
        { type: 2, style: 2, label: 'b', emoji: { name: '5Legendary_CODM' } },
        { type: 2, style: 2, label: 'c', emoji: { name: '🔥' } },
    ] }, { type: 1, components: [{ type: 3, options: [{ label: 'x', value: 'x', emoji: '<:cp:999999999999999999>' }] }] }]);
    t.resolveEmojis(m, index);
    const [a, b, c] = m.components[0].components;
    assert.deepStrictEqual(a.emoji, { id: '111111111111111111', name: 'DrawCalc', animated: true });
    assert.deepStrictEqual(b.emoji, { id: '222222222222222222', name: '5Legendary_CODM', animated: false });
    assert.deepStrictEqual(c.emoji, { name: '🔥' });
    assert.strictEqual(m.components[1].components[0].options[0].emoji.id, '333333333333333333');
});

console.log('dummyComponents / countComponents');
check('every non-link button and select gets its own dummy id; links untouched', () => {
    const comps = [
        { type: 9, components: [{ type: 10, content: 'x' }], accessory: { type: 2, style: 1, label: 'acc', custom_id: 'real_handler' } },
        { type: 1, components: [
            { type: 2, style: 1, label: 'a', custom_id: 'same' },
            { type: 2, style: 1, label: 'b', custom_id: 'same' },
            { type: 2, style: 5, label: 'site', url: 'https://dioreo.app' },
        ] },
        { type: 1, components: [{ type: 3, custom_id: 'pick', options: [{ label: 'x', value: 'x' }] }] },
    ];
    assert.strictEqual(t.dummyComponents(comps), 4);
    const ids = [];
    const collect = list => list.forEach(c => { if (c.custom_id) ids.push(c.custom_id); if (c.components) collect(c.components); if (c.accessory) collect([c.accessory]); });
    collect(comps);
    assert.strictEqual(new Set(ids).size, 4);
    assert.ok(ids.every(id => id.startsWith(t.DUMMY_PREFIX)), ids.join(','));
    assert.strictEqual(comps[1].components[2].custom_id, undefined);
});
check('the count is recursive and includes accessories', () => {
    assert.strictEqual(t.countComponents([{ type: 17, components: [{ type: 9, components: [{ type: 10 }], accessory: { type: 11 } }, { type: 14 }] }]), 5);
});

console.log('formatDiscordError / formatReport');
check('a 50035 tree flattens to one line per field', () => {
    const err = { code: 50035, rawError: { message: 'Invalid Form Body', errors: { components: { 0: { components: { 3: { content: { _errors: [{ code: 'BASE_TYPE_MAX_LENGTH', message: 'Must be 4000 or fewer in length.' }] } } } } } } } };
    const out = t.formatDiscordError(err);
    assert.ok(out.includes('components[0].components[3].content: Must be 4000 or fewer in length.'), out);
});
check('no note when every emoji was already right', () => {
    assert.strictEqual(t.formatReport({ named: [], remapped: [], fixed: [], unresolved: [] }, 3), null);
});

console.log('edit in place');
check('the Edit JSON row is one real button, never a dummy id', () => {
    const row = t.editRow({ name: 'Edit', id: '1' });
    assert.deepStrictEqual([row.type, row.components[0].custom_id, row.components[0].label], [1, 'embedtest_edit', 'Edit JSON']);
    assert.ok(!row.components[0].custom_id.startsWith(t.DUMMY_PREFIX));
});
check('the edit box keeps the paste, falls back to compact JSON, and refuses what cannot fit', () => {
    assert.strictEqual(t.editBoxText('{ "a": 1 }'), '{ "a": 1 }');
    const spaced = JSON.stringify({ components: Array(100).fill({ type: 10, content: 'x' }) }, null, 4);
    assert.ok(spaced.length > 4000);
    const fit = t.editBoxText(spaced);
    assert.ok(fit && fit.length <= 4000 && JSON.parse(fit).components.length === 100, 'whitespace dropped to fit');
    assert.strictEqual(t.editBoxText(JSON.stringify({ content: 'x'.repeat(5000) })), null);
});
check('a message turns back into JSON without its Edit row', () => {
    const msg = { flags: 32768 | 64, content: '', embeds: [], components: [{ type: 17, components: [{ type: 10, content: 'hi' }] }, t.editRow()] };
    const out = JSON.parse(t.payloadFromMessage(msg));
    assert.deepStrictEqual(out, { flags: 32768, components: [{ type: 17, components: [{ type: 10, content: 'hi' }] }] });
});

console.log('registration');
check('the command is skipped unless NODE_ENV is development', () => {
    const { loadCommandModules } = require(path.join(__dirname, '..', 'bot', 'registry'));
    const names = env => {
        const before = process.env.NODE_ENV;
        if (env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = env;
        try { return loadCommandModules({}).map(c => (c.toJSON ? c.toJSON().name : c.name)); }
        finally { if (before === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = before; }
    };
    assert.ok(!names(undefined).includes('embedtest'), 'registered with NODE_ENV unset (prod)');
    assert.ok(!names('production').includes('embedtest'), 'registered with NODE_ENV=production');
    assert.ok(names('development').includes('embedtest'), 'missing on the dev bot');
});

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log('\nall embed tester checks passed');
process.exit(0);
