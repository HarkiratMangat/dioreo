// scripts/ownerModule.test.js
// The property under test is the CLOSURE, not the value. utils/owner.js exists so that requiring
// the permission layer does not drag in the command surface.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function closure(entry) {
    const stack = [path.resolve(__dirname, '..', entry)];
    const local = new Set(); const ext = new Set();
    while (stack.length) {
        const f = stack.pop();
        if (local.has(f)) continue;
        local.add(f);
        let src; try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
        for (const m of src.matchAll(/require\(['"]([^'"]+)['"]\)/g)) {
            const r = m[1];
            if (!r.startsWith('.')) { ext.add(r); continue; }
            let q = path.resolve(path.dirname(f), r);
            if (!q.endsWith('.js')) q += '.js';
            if (fs.existsSync(q)) stack.push(q);
        }
    }
    return { local, ext };
}

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  \u2713 ${name}`); }
    catch (e) { failures++; console.error(`  \u2717 ${name}\n      ${e.message}`); }
}

check('utils/owner.js imports nothing', () => {
    const c = closure('utils/owner.js');
    assert.strictEqual(c.local.size, 1, `owner.js pulled ${c.local.size} local files; it must be a leaf`);
    assert.strictEqual(c.ext.size, 0, `owner.js pulled npm modules: ${[...c.ext].join(',')}`);
});

check('utils/adminAccess.js never reaches a command module or discord.js', () => {
    const c = closure('utils/adminAccess.js');
    const bad = [...c.local].filter(f => f.includes('/commands/'));
    assert.deepStrictEqual(bad, [], `adminAccess reaches command modules: ${bad.join(', ')}`);
    for (const heavy of ['discord.js', 'jimp', 'child_process']) {
        assert.ok(!c.ext.has(heavy), `adminAccess still pulls ${heavy} -- the portal cannot require it`);
    }
});

process.exit(failures ? 1 : 0);
