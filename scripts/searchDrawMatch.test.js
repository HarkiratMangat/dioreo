// scripts/searchDrawMatch.test.js bestDrawMatch() picks the RIGHT draw when isSameDrawTitle() says yes to several. Pure, no database.
const assert = require('assert');
const { bestDrawMatch, isSameDrawTitle } = require('../utils/search');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

const champion = { title: "Street Fighter: Champion's Collection Series Armory (Weapons)" };
const hero = { title: "Street Fighter: Hero's Collection Series Armory (Operators)" };

check("the premise: two different Street Fighter draws DO match each other (prod 2026-11-04)", () => {
    assert.ok(isSameDrawTitle(champion.title, hero.title), 'if this stops being true the helper is no longer needed for this pair');
});

check('each draw finds its own row, in either list order', () => {
    assert.strictEqual(bestDrawMatch([champion, hero], hero.title), hero);
    assert.strictEqual(bestDrawMatch([hero, champion], champion.title), champion);
    assert.strictEqual(bestDrawMatch([champion, hero], champion.title), champion);
});

check('a reworded title still finds its one match', () => {
    const row = { title: 'Halloween Series Armory' };
    assert.strictEqual(bestDrawMatch([row, hero], 'Halloween Armory Series'), row);
    assert.strictEqual(bestDrawMatch([row], 'Nothing Alike Whatsoever'), null);
});

check('with several fuzzy hits and no exact one, the most shared distinctive words wins; a tie keeps the first', () => {
    const a = { title: 'Iron Wolf Legendary Weapon' }, b = { title: 'Iron Wolf Nightfall Legendary' };
    assert.strictEqual(bestDrawMatch([a, b], 'Iron Wolf Nightfall Legendary Draw'), b);
    const c = { title: 'Iron Wolf Alpha' }, d = { title: 'Iron Wolf Beta' };
    assert.strictEqual(bestDrawMatch([c, d], 'Iron Wolf Gamma Pack'), c);
});

process.exit(failures ? 1 : 0);
