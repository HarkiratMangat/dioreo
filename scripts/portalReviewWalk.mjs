// scripts/portalReviewWalk.mjs — the COMMIT walk: does staged work actually become real?
//
// 🔴 WHY THIS EXISTS. `portal:status` read `review … realwalk · never` for the life of the portal. Review is the only screen where staged work becomes real — the highest-consequence action in the product — and no instrument on either side had ever exercised it. Not one commit, not one discard, not one gate refusal. Every other instrument in this family measures how a page LOOKS; a realm can be pixel-perfect against its design and still not commit, and Review is the realm where that distinction is the entire point.
//
// 🔴 AND `portal:realwalk` CANNOT COVER IT, WHICH IS WHY IT NEVER DID. That tool walks a realm's VIEWS in a browser, and Review has none: `review.html` carries no `data-view` and `review.js` passes no `viewOptions`. Pointed at Review it has nothing to click, so the gap was structural rather than an oversight — the near-neighbour instrument existed and was the wrong shape.
//
// WHAT IT DRIVES: the REAL dev server over HTTP — every route, `requireAdmin`, the CSRF check, `gateCommit`, and `commitSet`'s real `session.withTransaction()`. Nothing is stubbed and no function is called directly. The only thing minted locally is the session row, through the same `scripts/lib/portalSession.cjs` every other instrument uses, because the alternative is a Discord OAuth round trip that cannot be automated and that is what kept this unmeasured.
//
// ⚠️ IT WRITES TO THE DEV DATABASE AND PUTS IT BACK. The tier-1 change it commits is reverted through the real `/api/revert` route, which exercises `invert()` as a side effect rather than by a separate test. `--keep` leaves the rows for inspection. If it dies mid-run the leftovers are named in the output. `portalSession` itself refuses any non-local database, so this cannot run against prod.
//
// ⚠️ WHAT IT CANNOT SEE, stated so nobody reads a green run as more than it is: it drives the API, not the screen. It proves the server commits, refuses and audits; it does not prove the Review page renders any of that, which is the pixel work's job, nor that a person can reach the button.
//
//     node scripts/portalReviewWalk.mjs [--port 8787] [--keep]

import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const flag = (name, fallback) => {
    const i = process.argv.indexOf(name);
    return i === -1 ? fallback : process.argv[i + 1];
};
const PORT = Number(flag('--port', process.env.PORTAL_PORT || 8787));
const KEEP = process.argv.includes('--keep');
const BASE = `http://127.0.0.1:${PORT}`;
const STAMP = new Date().toISOString().replace(/[:.]/g, '-');

const { mintSession } = require(path.join(ROOT, 'scripts/lib/portalSession.cjs'));
const receipt = require(path.join(ROOT, 'scripts/lib/portalReceipt.cjs'));

const results = [];
const check = (id, what, pass, detail = '') => {
    results.push({ id, what, pass: !!pass, detail: String(detail) });
    return !!pass;
};

let raw = null;
let csrf = null;
const leftovers = { changesets: [], changeIds: [] };

async function api(method, route, body) {
    const res = await fetch(BASE + route, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Cookie: `portal_session=${raw}`,
            ...(method === 'GET' ? {} : { 'x-csrf-token': csrf }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json = null;
    try { json = await res.json(); } catch { /* a non-JSON body IS the finding; status carries it */ }
    return { status: res.status, json };
}

// The two numbers every assertion is really about. Read through the models rather than the API, because the API is the thing under test — asking it whether it worked is not evidence.
async function liveState(mongoose) {
    const SeasonalData = require(path.join(ROOT, 'models/SeasonalData'));
    const ChangeLog = require(path.join(ROOT, 'models/ChangeLog'));
    const doc = (await SeasonalData.findOne({ docType: 'global' }).lean()) || {};
    return {
        newDraws: (doc.newDraws || []).length,
        titles: (doc.newDraws || []).map((d) => d.title),
        changeLog: await ChangeLog.countDocuments({}),
        mongoose,
    };
}

async function main() {
    const sess = await mintSession(ROOT);
    if (!sess) throw new Error('portal:reviewwalk: could not mint a dev session — is .env.dev present with a localhost MONGODB_URI?');
    raw = sess.raw;

    const mongoose = require('mongoose');
    const uri = require('fs').readFileSync(path.join(ROOT, '.env.dev'), 'utf8')
        .split(/\r?\n/).find((l) => l.trimStart().startsWith('MONGODB_URI='))
        .split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    await mongoose.connect(uri);

    const auth = require(path.join(ROOT, 'portal/auth'));
    const session = await auth.sessionFor({ headers: { cookie: `portal_session=${raw}` } });
    check('S1', 'the minted session is readable by the real sessionFor()', !!session, session ? `signed in as ${sess.who}` : 'null');
    if (!session) throw new Error('session unreadable — everything below would be vacuous');
    csrf = auth.csrfToken(session);

    const Changeset = require(path.join(ROOT, 'models/Changeset'));
    const ChangeLog = require(path.join(ROOT, 'models/ChangeLog'));
    const before = await liveState(mongoose);
    check('S2', 'the live document is reachable', before.newDraws >= 0, `newDraws=${before.newDraws} changeLog=${before.changeLog}`);

    // ── 1 · the door and the resting board
    const r0 = await api('GET', '/api/review');
    check('1a', 'GET /api/review answers 200 to an admin session', r0.status === 200, `status=${r0.status}`);
    check('1b', 'the board returns both an ops list and a changesets list',
        Array.isArray(r0.json?.ops) && Array.isArray(r0.json?.changesets),
        `ops=${r0.json?.ops?.length} changesets=${r0.json?.changesets?.length}`);

    // ── 2 · stage a real tier-1 op, the way a realm would
    const title = `Realwalk Probe ${STAMP}`;
    const stage = await api('POST', '/api/changeset', { realm: 'season', ops: [{ type: 'draw.add', payload: { title, category: 'new' } }] });
    const csId = stage.json?.changesetId;
    if (csId) leftovers.changesets.push(csId);
    check('2a', 'staging a real draw.add returns 200', stage.status === 200, `status=${stage.status} ${JSON.stringify(stage.json?.failures || [])}`);
    check('2b', 'it is staged, not blocked', stage.json?.state === 'staged', `state=${stage.json?.state}`);
    check('2c', 'core/ops decides the tier and says 1', stage.json?.tier === 1, `tier=${stage.json?.tier}`);
    check('2d', 'the preview carries a real before/after rather than a placeholder',
        stage.json?.preview?.[0]?.after?.count === before.newDraws + 1,
        `${JSON.stringify(stage.json?.preview?.[0]?.before)} -> ${JSON.stringify(stage.json?.preview?.[0]?.after)}`);

    // ── 3 · Review shows it with the right tier, a field-level diff, and an OPEN gate
    const r1 = await api('GET', '/api/review');
    const op = (r1.json?.ops || []).find((o) => o.changesetId === String(csId));
    const set = (r1.json?.changesets || []).find((c) => String(c.id || c._id) === String(csId));
    check('3a', 'the staged op appears on the Review board', !!op, op ? op.name : `not among ${(r1.json?.ops || []).length} ops`);
    check('3b', 'Review reports the tier core/ops assigned', op?.tier === 1, `tier=${op?.tier}`);
    check('3c', 'Review carries a field-level diff, not just a summary line',
        Array.isArray(op?.rows) && op.rows.length > 0, `rows=${(op?.rows || []).map((r) => r.key).join(',') || 'none'}`);
    check('3d', 'the commit gate is OPEN for a tier-1 set with no export', set?.gate?.ok === true, JSON.stringify(set?.gate));

    // ── 4 · commit, and prove the document AND the audit row both moved
    const commit = await api('POST', `/api/changeset/${csId}/commit`, {});
    check('4a', 'commit returns 200', commit.status === 200, `status=${commit.status}`);
    const after = await liveState(mongoose);
    check('4b', 'the draw is really in the live document', after.titles.includes(title), `newDraws ${before.newDraws} -> ${after.newDraws}`);
    check('4c', 'exactly one ChangeLog row was written', after.changeLog === before.changeLog + 1, `changeLog ${before.changeLog} -> ${after.changeLog}`);
    const row = await ChangeLog.findOne({}).sort({ createdAt: -1 }).lean();
    if (row?.changeId) leftovers.changeIds.push(row.changeId);
    check('4d', 'the audit row names the actor', row?.actorId === sess.who, `actorId=${row?.actorId}`);
    check('4e', 'the audit row names what changed', row?.action === 'add' && row?.target === title, `${row?.action} "${row?.target}"`);
    check('4f', 'the audit row carries an inverse, so the change is revertible', !!row?.inverse, row?.inverse?.type || 'null');
    const csDoc = await Changeset.findById(csId).lean();
    check('4g', 'the changeset is marked committed, with a timestamp', csDoc?.state === 'committed' && !!csDoc?.committedAt, `state=${csDoc?.state}`);

    // ── 5 · discard a second set, and prove NOTHING moved
    const mid = await liveState(mongoose);
    const stage2 = await api('POST', '/api/changeset', { realm: 'season', ops: [{ type: 'draw.add', payload: { title: `Realwalk Discard ${STAMP}`, category: 'new' } }] });
    const cs2 = stage2.json?.changesetId;
    if (cs2) leftovers.changesets.push(cs2);
    const disc = await api('POST', `/api/changeset/${cs2}/discard`, {});
    const afterDisc = await liveState(mongoose);
    check('5a', 'discard returns 200', disc.status === 200, `status=${disc.status}`);
    check('5b', 'a discard leaves the live document untouched', afterDisc.newDraws === mid.newDraws, `newDraws ${mid.newDraws} -> ${afterDisc.newDraws}`);
    check('5c', 'a discard writes no audit row', afterDisc.changeLog === mid.changeLog, `changeLog ${mid.changeLog} -> ${afterDisc.changeLog}`);
    check('5d', 'the discarded set is marked discarded', (await Changeset.findById(cs2).lean())?.state === 'discarded');

    // ── 6 · force a REFUSAL — a tier-3 op with no export must be blocked, and must say why
    const stage3 = await api('POST', '/api/changeset', { realm: 'season', ops: [{ type: 'draw.purge', payload: { category: 'new' }, target: { category: 'new' } }] });
    const cs3 = stage3.json?.changesetId;
    if (cs3) leftovers.changesets.push(cs3);
    check('6a', 'the destructive op is recognised as tier 3', stage3.json?.tier === 3, `tier=${stage3.json?.tier}`);
    const r3 = await api('GET', '/api/review');
    const set3 = (r3.json?.changesets || []).find((c) => String(c.id || c._id) === String(cs3));
    check('6b', 'Review shows the gate CLOSED for it', set3?.gate?.ok === false, JSON.stringify(set3?.gate));
    check('6c', 'and the screen is given a reason in words, not a boolean',
        typeof set3?.gate?.reason === 'string' && set3.gate.reason.length > 0, set3?.gate?.reason);
    const refused = await api('POST', `/api/changeset/${cs3}/commit`, {});
    check('6d', 'the server REFUSES the commit with 409', refused.status === 409, `status=${refused.status}`);
    check('6e', 'the refusal names the export requirement', /export/i.test(JSON.stringify(refused.json || {})), refused.json?.reason || '');
    const afterRefusal = await liveState(mongoose);
    check('6f', 'nothing was destroyed by the refused commit', afterRefusal.newDraws === afterDisc.newDraws, `newDraws ${afterDisc.newDraws} -> ${afterRefusal.newDraws}`);
    if (!KEEP) await api('POST', `/api/changeset/${cs3}/discard`, {});

    // ── 7 · put the database back THROUGH THE ROUTE, which is also the only test of the revert seam
    //        that a URL-encoding bug cannot pass: a `#N` id has to survive the trip both ways.
    if (!KEEP && leftovers.changeIds.length) {
        const id = leftovers.changeIds[0];
        const rev = await api('POST', `/api/revert/${encodeURIComponent(id)}`, {});
        check('7a', `POST /api/revert/${id} returns 200 — the id survived the URL`, rev.status === 200, `status=${rev.status} ${rev.json?.error || ''}`);
        const end = await liveState(mongoose);
        check('7b', 'the probe draw is gone again — database left as found', !end.titles.includes(title), `newDraws=${end.newDraws} (started ${before.newDraws})`);
    }

    await require(path.join(ROOT, 'models/PortalSession'))
        .deleteOne({ sessionHash: crypto.createHash('sha256').update(raw).digest('hex') });
    await mongoose.disconnect();
}

main().then(() => {
    const pad = Math.max(...results.map((r) => r.what.length));
    console.log(`\nportal:reviewwalk — review · ${BASE} · session minted in dev Mongo for this run\n`);
    console.log(results.map((r) => `  ${r.pass ? '✓' : '❌'} ${r.id.padEnd(3)} ${r.what.padEnd(pad)}  ${r.detail}`).join('\n'));
    const failed = results.filter((r) => !r.pass);
    console.log(`\n  ${results.length - failed.length}/${results.length} passed`);
    if (KEEP) console.log(`  --keep: left behind ${leftovers.changesets.join(', ') || 'nothing'}`);
    if (!failed.length) receipt.record('commitwalk', 'review', `${results.length} assertions`);
    process.exit(failed.length ? 1 : 0);
}).catch(async (e) => {
    console.error('\nWALK ABORTED:', e?.stack || e);
    console.error('leftovers:', JSON.stringify(leftovers));
    try { await require('mongoose').disconnect(); } catch { /* best effort */ }
    process.exit(3);
});
