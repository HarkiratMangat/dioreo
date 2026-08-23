const assert = require('assert');
const bot = require('../commands/bot');

let passed = 0;
function check(name, fn) { fn(); passed++; console.log(`  ✓ ${name}`); }

// The recursive walker Discord itself applies -- copied from scripts/colorPanelBudget.test.js. A walker following only `components` would miss the Section accessories Task 4 introduces, which is the exact case this budget exists to catch.
const LIMIT = 40;
const countComponents = node => Array.isArray(node)
    ? node.reduce((n, x) => n + countComponents(x), 0)
    : (node && typeof node === 'object')
        ? 1 + countComponents(node.components || []) + (node.accessory ? countComponents(node.accessory) : 0) + countComponents(node.items || [])
        : 0;

check('every page-switcher option carries the question its page answers', () => {
    const row = bot.pageSelectRow('health');
    const options = row.components[0].options;
    assert.strictEqual(options.length, 5);
    for (const o of options) {
        assert.ok(o.description && o.description.length > 0, `option "${o.value}" has no description`);
        assert.ok(o.description.length <= 100, `option "${o.value}" description exceeds Discord's 100-char cap`);
    }
    // Descriptions must be DISTINCT -- five near-identical descriptions would reproduce the very bug this redesign fixes, one level up.
    assert.strictEqual(new Set(options.map(o => o.description)).size, 5);
});

console.log(`  ✓ ${passed} /bot analytics checks passed`);
