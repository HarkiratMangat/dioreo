// scripts/portalReviewWalk.mjs — the COMMIT walk: does staged work actually become real?
//
// 🔴 WHY THIS EXISTS. `portal:status` read `review … realwalk · never` for the life of the portal. Review is the only screen where staged work becomes real — the highest-consequence action in the product — and no instrument on either side had ever exercised it. Not one commit, not one discard, not one gate refusal. Every other instrument in this family measures how a page LOOKS; a realm can be pixel-perfect against its design and still not commit, and Review is the realm where that distinction is the entire point.
//
// 🔴 AND `portal:realwalk` CANNOT COVER IT, WHICH IS WHY IT NEVER DID. That tool walks a realm's VIEWS in a browser, and Review has none: `review.html` carries no `data-view` and `review.js` passes no `viewOptions`. Pointed at Review it has nothing to click, so the gap was structural rather than an oversight — the near-neighbour instrument existed and was the wrong shape.
//
// ⚠️ WHAT IT DOES NOT PROVE, STATED BECAUSE THE FIRST VERSION OF THIS HEADER OVERCLAIMED IT: this asserts that a ChangeLog row EXISTS after a commit, which is NOT the same as proving it was written INSIDE the transaction. An audit write that ran outside `withTransaction` and survived a rollback would pass every assertion here. Proving atomicity needs a fault injection — abort after apply() and assert the row is absent too — and that is filed in docs/db-deferred-list.md rather than claimed. 2026-09-03 00:21 EDT.
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
    const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
    // 🔴 A FINGERPRINT, BECAUSE A LENGTH IS NOT A DOCUMENT. Until 2026-09-03 09:03 EDT the "nothing moved" assertions compared `newDraws.length` alone, so a discard that mutated any OTHER field — or that removed one draw and added another — passed while announcing the document was untouched. The reader test named it. `doc` is returned too, so a missing global document is a FAILURE rather than an empty object that satisfies every count.
    const fingerprint = crypto.createHash('sha1').update(JSON.stringify(doc || {})).digest('hex').slice(0, 12);
    return {
        doc, fingerprint,
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
    // ⚠️ ASSERTS THE DOCUMENT, NOT A COUNT DERIVED FROM IT. `newDraws >= 0` is true even when no global document exists at all — a vacuous pass that announced the opposite of what it checked, found by the reader test 2026-09-03 09:03 EDT.
    check('S2', 'the live document exists and is reachable', !!before.doc, before.doc ? `newDraws=${before.newDraws} changeLog=${before.changeLog} fp=${before.fingerprint}` : 'NO global document');

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
        Array.isArray(op?.rows) && op.rows.length > 0 && op.rows.every((r) => r.key && String(r.key).trim()),
        `rows=${(op?.rows || []).map((r) => r.key).join(',') || 'none'}`);
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
    check('5b', 'a discard leaves the WHOLE live document untouched', afterDisc.fingerprint === mid.fingerprint, `fp ${mid.fingerprint} -> ${afterDisc.fingerprint}`);
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
    // ⚠️ THE REASON FIELD, not any occurrence of the word anywhere in the body — a field NAME containing "export" used to satisfy this.
    check('6e', 'the refusal names the export requirement in its reason', /export/i.test(String(refused.json?.reason || '')), refused.json?.reason || '(no reason field)');
    const afterRefusal = await liveState(mongoose);
    check('6f', 'nothing was destroyed by the refused commit', afterRefusal.fingerprint === afterDisc.fingerprint, `fp ${afterDisc.fingerprint} -> ${afterRefusal.fingerprint}`);
    if (!KEEP) await api('POST', `/api/changeset/${cs3}/discard`, {});

    // ── 6b · a BLOCKED changeset — the branch whose reason was once thrown away at the seam
    //        `/api/review` records that it read `failure.reason`, which no validator sets, so the screen said
    //        "This change no longer validates" while the system held the exact sentence. Nothing reaches this
    //        state: the harness sets `blocked: null` unconditionally, and a walk that stages VALID ops never
    //        produces one. So it is staged here deliberately, with an op the validator must refuse.
    const stageBad = await api('POST', '/api/changeset', { realm: 'season', ops: [{ type: 'draw.add', payload: { category: 'new' } }] });
    const csBad = stageBad.json?.changesetId;
    if (csBad) leftovers.changesets.push(csBad);
    check('6g', 'an invalid op is accepted as a changeset but marked blocked', stageBad.json?.state === 'blocked', `state=${stageBad.json?.state}`);
    check('6h', 'the validator\'s own sentence survives to the caller, not a generic one',
        JSON.stringify(stageBad.json?.failures || []).includes('title'), JSON.stringify(stageBad.json?.failures || []).slice(0, 120));
    const rBad = await api('GET', '/api/review');
    const opBad = (rBad.json?.ops || []).find((o) => o.changesetId === String(csBad));
    check('6i', 'Review carries the specific reason, not "no longer validates"',
        typeof opBad?.blocked === 'string' && /title/i.test(opBad.blocked), opBad?.blocked);
    const commitBad = await api('POST', `/api/changeset/${csBad}/commit`, {});
    check('6j', 'a blocked changeset REFUSES to commit', commitBad.status !== 200, `status=${commitBad.status} ${JSON.stringify(commitBad.json).slice(0, 120)}`);
    const afterBad = await liveState(mongoose);
    check('6k', 'and nothing was written by the refusal', afterBad.fingerprint === afterRefusal.fingerprint && afterBad.changeLog === afterRefusal.changeLog,
        `fp=${afterBad.fingerprint} changeLog=${afterBad.changeLog}`);
    if (!KEEP) await api('POST', `/api/changeset/${csBad}/discard`, {});

    // ── 7 · put the database back THROUGH THE ROUTE, which is also the only test of the revert seam
    //        that a URL-encoding bug cannot pass: a `#N` id has to survive the trip both ways.
    if (!KEEP && leftovers.changeIds.length) {
        const id = leftovers.changeIds[0];
        // 🔴 BOTH HALVES, SEPARATELY. Until 2026-09-03 09:03 EDT this encoded the id ITSELF and then called the result "the id survived the URL" — which proves the SERVER decodes and says nothing about the client, whose only cover is a source regex. The raw probe reproduces the actual shipped bug: a bare `#` makes the rest a fragment, so the route sees no id.
        const rawProbe = await api('POST', `/api/revert/${id}`, {});
        check('7a1', 'a RAW id is not addressable — the client must encode it', rawProbe.status !== 200, `status=${rawProbe.status} (the fragment bug, reproduced)`);
        const rev = await api('POST', `/api/revert/${encodeURIComponent(id)}`, {});
        check('7a', `POST /api/revert/${id} encoded returns 200 — the SERVER decodes`, rev.status === 200, `status=${rev.status} ${rev.json?.error || ''}`);
        const end = await liveState(mongoose);
        check('7b', 'the probe draw is gone again — database left as found', !end.titles.includes(title), `newDraws=${end.newDraws} (started ${before.newDraws})`);
    }

    await require(path.join(ROOT, 'models/PortalSession'))
        .deleteOne({ sessionHash: crypto.createHash('sha256').update(raw).digest('hex') });
    await mongoose.disconnect();
}

// 🔴 THE EXPECTED COUNT IS PINNED, because the pass line used to be self-referential: section 7 is conditional on `--keep` and on a ChangeLog row existing, so a silently shorter run printed `34/34 passed`, exited 0 and filed a GREEN receipt — structurally the same defect as the empty-mockup comparison this walk's own realm was fixed for. 2026-09-03 09:03 EDT. ⚠️ 37 IS MEASURED, NOT COUNTED BY HAND — the first version of this line said 39 and the pin caught it on its own first run, which is the only reason it is right now. Update it deliberately when assertions are added. 2026-09-03 09:04 EDT.
const EXPECTED = 37;

main().then(() => {
    const pad = Math.max(...results.map((r) => r.what.length));
    console.log(`\nportal:reviewwalk — review · ${BASE} · session minted in dev Mongo for this run\n`);
    console.log(results.map((r) => `  ${r.pass ? '✓' : '❌'} ${r.id.padEnd(3)} ${r.what.padEnd(pad)}  ${r.detail}`).join('\n'));
    const failed = results.filter((r) => !r.pass);
    const short = !KEEP && results.length !== EXPECTED;
    console.log(`\n  ${results.length - failed.length}/${results.length} passed` + (short ? ` — ❌ EXPECTED ${EXPECTED}: this run SKIPPED assertions, so a green line here is not a full walk` : ''));
    if (KEEP) console.log(`  --keep: left behind ${leftovers.changesets.join(', ') || 'nothing'}`);
    if (!failed.length && !short) receipt.record('commitwalk', 'review', `${results.length} assertions`);
    process.exit(failed.length || short ? 1 : 0);
}).catch(async (e) => {
    console.error('\nWALK ABORTED:', e?.stack || e);
    console.error('leftovers:', JSON.stringify(leftovers));
    try { await require('mongoose').disconnect(); } catch { /* best effort */ }
    process.exit(3);
});
