// scripts/portalGeometry.test.mjs — proves the geometry fixture's COMPARISON can fail, without needing a browser.
//
// 🔴 THE CAPTURE NEEDS CHROME; THE DIFF DOES NOT — and the diff is the half that silently decides whether a regression is reported. A comparison that returns an empty array for every input is a fixture system that certifies every change, and it looks exactly like a stable realm. So `compare()` is exported and every property it is trusted for is pinned here: a moved count fails, a renamed tab fails, a vanished column fails, a dropped view fails, and identical input stays silent.
//
// ⚠️ It deliberately does NOT assert the capture's numbers. Those are a property of the design at a moment in time; asserting them here would duplicate the fixture files and make a legitimate redesign fail two places instead of one.
import assert from 'assert';
import { execFileSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { compare } from './portalGeometry.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let passed = 0;
const check = (label, fn) => { fn(); passed++; console.log(`  ✓ ${label}`); };

const view = (over = {}) => ({
    grid: { examined: 1381, nearMisses: 0, sizeIssues: 26, ...(over.grid || {}) },
    inventory: { h1: 'Season', tabs: ['Track', 'Board', 'Repairs'], cols: ['Item', 'Runs'], sections: ['The season record'], ...(over.inventory || {}) },
});
const fixture = (views) => ({ realm: 'season', viewport: { w: 1282, h: 888 }, views });

console.log('portal:geometry self-test\n');

check('identical input is silent — the fixture must not cry wolf on a no-op run', () => {
    assert.deepStrictEqual(compare(fixture({ Track: view() }), fixture({ Track: view() })), []);
});

check('a moved count is reported, and names which count moved', () => {
    const moved = compare(fixture({ Track: view() }), fixture({ Track: view({ grid: { sizeIssues: 31 } }) }));
    assert.strictEqual(moved.length, 1);
    assert.strictEqual(moved[0].what, 'sizeIssues');
    assert.strictEqual(moved[0].was, 26);
    assert.strictEqual(moved[0].now, 31);
});

// 🔴 THE IDENTITY HALF. `__grid` reports geometry, so two elements can be exactly on-grid and be the wrong two — a renamed tab or a lost column moves no pixel and must still fail.
check('a renamed tab and a vanished column are reported even when every count is unchanged', () => {
    const after = view({ inventory: { tabs: ['Track', 'Board', 'Fixes'], cols: ['Item'] } });
    const moved = compare(fixture({ Track: view() }), fixture({ Track: after }));
    assert.deepStrictEqual(moved.map((m) => m.what).sort(), ['cols', 'tabs']);
});

check('a view that disappeared, and one that appeared, are both reported', () => {
    const gone = compare(fixture({ Track: view(), Board: view() }), fixture({ Track: view() }));
    assert.deepStrictEqual(gone.map((m) => [m.view, m.now]), [['Board', '— gone']]);
    const fresh = compare(fixture({ Track: view() }), fixture({ Track: view(), Repairs: view() }));
    assert.deepStrictEqual(fresh.map((m) => [m.view, m.now]), [['Repairs', 'present']]);
});

// Part 0 builds this runner before any realm has closed. An empty fixture directory must read as "nothing recorded", never as a pass — and never as a failure either, or every run of the suite goes red for the whole of Part 0.
check('with no fixtures recorded, --all --check says so plainly and exits 0', () => {
    const out = execFileSync('node', [path.join(HERE, 'portalGeometry.mjs'), '--all', '--check'], { encoding: 'utf8' });
    if (/no fixtures recorded yet/.test(out)) return;
    assert.match(out, /examined\/near\/size|matches its fixture|no fixture yet/, 'once fixtures exist it must actually check them');
});

console.log(`\n✅ ${passed} cases — the comparison is proven able to report movement, identity change and a lost view.`);
