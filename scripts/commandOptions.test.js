// scripts/commandOptions.test.js -- two rules about slash-command options, checked against the real builders.
//
// 1. `visibility` is always the LAST option of a command or subcommand (Harkirat, 2026-10-25 21:56 EDT: "visibility is always the last option on a slash command"). /timestamp had it before `view` until 2026-10-25 22:44 EDT.
// 2. /help (commands/help.js CATEGORY_DEFS) names only options the command really has, in the command's own order. Its option lists are typed by hand, so a renamed or reordered option used to leave /help describing an option that no longer exists (the 2026-10-25 click-test found /colors, /calendar and /timestamp out of step; /remind's `set`/`toggle` became `releases`/`leaving` the same day).
const assert = require('assert');
const fs = require('fs');
const path = require('path');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

// Every slash command's leaves: '/name' or '/name sub' -> its option names, in order.
const leaves = new Map();
for (const f of fs.readdirSync(path.join(__dirname, '..', 'commands')).filter(f => f.endsWith('.js'))) {
    const mod = require(path.join(__dirname, '..', 'commands', f));
    const json = mod.data?.toJSON?.();
    if (!json || (json.type && json.type !== 1)) continue; // right-click commands have no options
    const subs = (json.options || []).filter(o => o.type === 1);
    if (subs.length) for (const sub of subs) leaves.set(`/${json.name} ${sub.name}`, (sub.options || []).map(o => o.name));
    else leaves.set(`/${json.name}`, (json.options || []).map(o => o.name));
}

check('visibility is the last option wherever a command has it', () => {
    const wrong = [...leaves].filter(([, names]) => names.includes('visibility') && names[names.length - 1] !== 'visibility').map(([leaf, names]) => `${leaf}: ${names.join(', ')}`);
    assert.deepStrictEqual(wrong, []);
});

check("/help lists only real options, in the command's order", () => {
    const { CATEGORY_DEFS } = require('../commands/help');
    const bad = [];
    for (const cat of CATEGORY_DEFS) for (const c of [...(cat.detailCommands || []), ...cat.staticCommands]) {
        if (!c.options?.length) continue;
        const real = leaves.get(c.name);
        if (!real) { bad.push(`${c.name}: no such command`); continue; }
        const named = c.options.map(o => o.name);
        const missing = named.filter(n => !real.includes(n));
        if (missing.length) bad.push(`${c.name}: /help names ${missing.join(', ')}, the command has ${real.join(', ')}`);
        else if (named.join() !== real.filter(n => named.includes(n)).join()) bad.push(`${c.name}: /help order ${named.join(', ')}, the command's ${real.join(', ')}`);
    }
    assert.deepStrictEqual(bad, []);
});

if (failures) { console.error(`\n${failures} check(s) failed.`); process.exit(1); }
console.log('\ncommandOptions: all checks passed.');
process.exit(0);
