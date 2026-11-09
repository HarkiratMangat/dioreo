// scripts/emojiPanelState.test.js -- /manage emojis' loadState with the other bot's status report present (2026-11-09 13:49 EST). The panel threw "SHORT is not defined" on prod from v3.14.0 (#262): SHORT moved to utils/emojiSync.js and the panel kept reading it, on the one path (a report from the other bot) emojiSync.test.js never reached.
const assert = require('assert');
const S = require('../utils/emojiSync');
const real = { listAppEmojis: S.listAppEmojis, readOtherStatus: S.readOtherStatus, listOriginals: S.listOriginals };
(async () => {
    try {
        S.listAppEmojis = async () => [];
        S.listOriginals = async () => new Set();
        S.readOtherStatus = async () => ({ env: 'prod', at: '2026-11-09T18:00:00Z', apps: [{ key: 'main', label: 'Dioreo', emojis: [{ name: 'Checkmark', id: '1', animated: true }] }, { key: 'admin', label: 'Dioreo Admin', emojis: [] }] });
        const { loadState } = require('../utils/emojiPanel');
        const state = await loadState();
        const remote = state.apps.filter(a => a.remote);
        assert.deepStrictEqual(remote.map(a => a.short), ['Dioreo', 'Admin'], 'the other bot\'s two apps, by their short names');
        assert.ok(Array.isArray(state.rows), 'rows built');
        console.log('  PASS  loadState reads the other bot\'s status report without throwing');
        console.log('\nemojiPanelState: 1 passed, 0 failed');
    } catch (e) {
        console.error(`  FAIL  loadState with a status report\n        ${e.message}`);
        process.exitCode = 1;
    } finally { Object.assign(S, real); }
})();
