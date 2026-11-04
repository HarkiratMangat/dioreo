// scripts/mongooseOptions.test.js -- no Mongoose call passes the deprecated `new: true` option (code-housekeeping, 2026-11-04 13:40 EST). Why: prod's log printed "the `new` option for findOneAndUpdate() and findOneAndReplace() is deprecated" 52 times in the 10 days before 2026-11-04, once per restart, from every version since v3.0.0. The six calls that passed it now pass `returnDocument: 'after'`, which is the same behaviour. This keeps a seventh from coming back. The portal (pins2's) is outside this check.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..');
const files = cp.execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n')
    .filter(f => /^(bot|handlers|utils|core|commands|models)\/.*\.js$/.test(f) || f === 'index.js');
const hits = [];
for (const f of files) {
    fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').forEach((line, i) => {
        if (/^\s*\/\//.test(line)) return;
        if (/\bnew:\s*true\b/.test(line)) hits.push(`${f}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
}
assert.deepStrictEqual(hits, [], `Mongoose's \`new: true\` is deprecated; pass returnDocument: 'after' instead:\n${hits.join('\n')}`);
console.log(`  ✓ no \`new: true\` Mongoose option in ${files.length} files`);
