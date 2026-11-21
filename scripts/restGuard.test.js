// scripts/restGuard.test.js utils/restGuard.js against stand-ins: a wiped REST token comes back when Discord still accepts it, stays off and alerts when Discord rejects it, is retried when Discord does not answer, and a real shutdown (client.token cleared first) passes straight through. The 5-minute probe alerts on the second failure in a row, once, and says when it recovers. Added 2026-11-21 12:13 EST after that morning's two-hour outage.
const assert = require('assert');
const { guardRestToken, startRestProbe } = require('../utils/restGuard');

function fakeClient() {
    const rest = { token: 'T', setToken(t) { this.token = t; return this; } };
    return { token: 'T', rest };
}
const respond = (status) => async () => ({ status });
const settle = () => new Promise(r => setTimeout(r, 20));

(async () => {
    // 1. Discord still accepts the token: it goes back, one error alert.
    {
        const c = fakeClient(); const alerts = [];
        guardRestToken(c, 'Dioreo', { fetchImpl: respond(200), alert: (t, d, l) => alerts.push({ t, l }) });
        c.rest.setToken(null);
        assert.strictEqual(c.rest.token, null, 'the wipe itself still happens');
        await settle();
        assert.strictEqual(c.rest.token, 'T', 'restored');
        assert.deepStrictEqual(alerts.map(a => a.l), ['error']);
        assert.ok(alerts[0].t.includes('restored'));
        console.log('ok: a wiped token Discord still accepts is put back, with an alert');
    }
    // 2. Discord rejects it: stays off, alert says so.
    {
        const c = fakeClient(); const alerts = [];
        guardRestToken(c, 'Dioreo', { fetchImpl: respond(401), alert: (t) => alerts.push(t) });
        c.rest.setToken(null); await settle();
        assert.strictEqual(c.rest.token, null);
        assert.ok(alerts.length === 1 && alerts[0].includes('REJECTED'));
        console.log('ok: a token Discord rejects stays off, with an alert');
    }
    // 3. No answer: retried, then restored when Discord answers.
    {
        const c = fakeClient(); const alerts = []; let calls = 0;
        const fetchImpl = async () => { calls += 1; if (calls < 3) throw new Error('network'); return { status: 200 }; };
        guardRestToken(c, 'Dioreo', { fetchImpl, retryMs: 5, alert: (t) => alerts.push(t) });
        c.rest.setToken(null); await new Promise(r => setTimeout(r, 80));
        assert.strictEqual(calls, 3); assert.strictEqual(c.rest.token, 'T');
        console.log('ok: an unanswered check is retried');
    }
    // 4. Shutdown: client.token cleared first, nothing is checked or restored.
    {
        const c = fakeClient(); let checked = false;
        guardRestToken(c, 'Dioreo', { fetchImpl: async () => { checked = true; return { status: 200 }; }, alert: () => {} });
        c.token = null; c.rest.setToken(null); await settle();
        assert.strictEqual(checked, false); assert.strictEqual(c.rest.token, null);
        console.log('ok: a real shutdown is left alone');
    }
    // 4b. A token wiped again and again: restored 5 times in an hour, then left off with an alert.
    {
        const c = fakeClient(); const alerts = [];
        guardRestToken(c, 'Dioreo', { fetchImpl: respond(200), alert: (t) => alerts.push(t) });
        for (let i = 0; i < 6; i++) { c.rest.setToken(null); await settle(); }
        assert.strictEqual(c.rest.token, null, 'the 6th wipe is not restored');
        assert.strictEqual(alerts.filter(x => x.includes('restored')).length, 5);
        assert.ok(alerts[5].includes('keeps getting wiped'));
        console.log('ok: a token wiped over and over is restored 5 times an hour, then left off');
    }
    // 4c. Trouble state: set by a wipe, read by the failure note, clears after 15 minutes.
    {
        const g = require('../utils/restGuard'); g._resetTrouble();
        assert.strictEqual(g.inTrouble(), false);
        g.noteTrouble(1000); assert.strictEqual(g.inTrouble(1000 + 60_000), true); assert.strictEqual(g.inTrouble(1000 + 16 * 60_000), false);
        g._resetTrouble();
        console.log('ok: the trouble state clears 15 minutes after the last trouble');
    }
    // 5. Probe: alerts on the 2nd failure, once, then on recovery.
    {
        const alerts = []; let fail = true;
        const p = startRestProbe({ isReady: () => true }, 'Dioreo', { everyMs: 1e9, alert: (t, d, l) => alerts.push(l), read: async () => { if (fail) throw new Error('down'); } });
        await p.tick(); assert.strictEqual(alerts.length, 0);
        await p.tick(); assert.deepStrictEqual(alerts, ['error']);
        await p.tick(); assert.deepStrictEqual(alerts, ['error']);
        fail = false; await p.tick(); assert.deepStrictEqual(alerts, ['error', 'info']);
        p.stop();
        const q = startRestProbe({ isReady: () => false }, 'Dioreo', { everyMs: 1e9, alert: () => assert.fail('no alert before ready'), read: async () => { throw new Error('x'); } });
        await q.tick(); await q.tick(); q.stop();
        console.log('ok: the probe alerts once on the second failure and says when it recovers');
    }
})().catch(err => { console.error(err); process.exit(1); });
