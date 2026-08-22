// scripts/portalBoot.test.js The environment guard is the first thing written because it is the one mistake that cannot be undone: a dev session pointed at the production database. Same failure class as the multiple-bot-instances rule.
const assert = require('assert');
const { assertEnvironment } = require('../portal/server');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('development refuses a production-looking database', () => {
    assert.throws(
        () => assertEnvironment({ env: 'development', mongoUri: 'mongodb+srv://x/diors-builds' }),
        /refus/i,
        'a dev portal pointed at prod must not boot'
    );
});

check('production refuses a dev-looking database', () => {
    assert.throws(
        () => assertEnvironment({ env: 'production', mongoUri: 'mongodb://localhost:27017/diors-builds-dev' }),
        /refus/i
    );
});

check('a matching pair boots', () => {
    assert.doesNotThrow(() => assertEnvironment({ env: 'development', mongoUri: 'mongodb://localhost:27017/diors-builds-dev' }));
    assert.doesNotThrow(() => assertEnvironment({ env: 'production', mongoUri: 'mongodb+srv://x/diors-builds' }));
});

check('a missing MONGODB_URI is refused, never defaulted', () => {
    assert.throws(() => assertEnvironment({ env: 'production', mongoUri: '' }), /MONGODB_URI/);
});

process.exit(failures ? 1 : 0);
