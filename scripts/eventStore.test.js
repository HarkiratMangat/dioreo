// scripts/eventStore.test.js -- coverage for the event plane's writer (utils/eventStore.js), observability layer stage 2. Pure logic plus a stubbed Mongoose model: no Atlas, no Discord, no Cloudinary. What is deliberately NOT covered here: whether Mongo actually accepts the documents (that is the live dev-bot boot test) and the Cloudinary/Vertex/REST wrappers (they are transparent proxies with no logic of their own). Run: `node scripts/eventStore.test.js` (also via `npm test`).

const assert = require('assert');
const path = require('path');
const Module = require('module');

// --- Stub the model BEFORE eventStore lazily requires it, so a flush is observable without Mongo. ---
const inserted = [];
const modelPath = require.resolve('../models/AnalyticsEvent');
require.cache[modelPath] = new Module(modelPath, null);
require.cache[modelPath].filename = modelPath;
require.cache[modelPath].loaded = true;
require.cache[modelPath].exports = {
    insertMany: async (docs) => { inserted.push(...docs); },
    estimatedDocumentCount: async () => 0,
};
const termPath = require.resolve('../models/SearchTerm');
const upserts = [];       // flattened bulkWrite ops across every call
let bulkWriteCalls = 0;   // count of bulkWrite INVOCATIONS, distinct from upserts.length (ops)
require.cache[termPath] = new Module(termPath, null);
require.cache[termPath].filename = termPath;
require.cache[termPath].loaded = true;
require.cache[termPath].exports = { bulkWrite: async (ops) => { bulkWriteCalls++; upserts.push(...ops); } };

process.env.ANALYTICS_HMAC_KEY = process.env.ANALYTICS_HMAC_KEY || Buffer.alloc(32, 7).toString('base64');
const { runWithContext, hashUserId } = require('../utils/requestContext');
const S = require('../utils/eventStore');

let failures = 0;
const checks = [];
function check(name, fn) { checks.push([name, fn]); }

const RAW_ID = '1139845545754632283';   // a real-shaped Discord snowflake

// --- normalizeTerm --------------------------------------------------------------------------
check('normalizeTerm lowercases, trims and collapses whitespace', () => {
    assert.strictEqual(S.normalizeTerm('  KILO   141 '), 'kilo 141');
});
check('normalizeTerm caps the term at 100 characters so a mis-paste cannot become a permanent record', () => {
    assert.strictEqual(S.normalizeTerm('x'.repeat(5000)).length, S.TERM_MAX_CHARS);
});
check('normalizeTerm returns an empty string for a non-string, never throws', () => {
    assert.strictEqual(S.normalizeTerm(undefined), '');
    assert.strictEqual(S.normalizeTerm(42), '');
});

// --- customIdPrefix -------------------------------------------------------------------------
check('customIdPrefix keeps only the segment before the first underscore', () => {
    assert.strictEqual(S.customIdPrefix('mng_act_draws_add'), 'mng');
    assert.strictEqual(S.customIdPrefix('colors_page_2'), 'colors');
});
check('customIdPrefix never returns a segment that embeds a user snowflake', () => {
    // The realistic leak: mng_admin_<discordId>. The prefix must stop at 'mng'.
    const prefix = S.customIdPrefix(`mng_admin_${RAW_ID}`);
    assert.strictEqual(prefix, 'mng');
    assert.ok(!String(prefix).includes(RAW_ID));
});
check('customIdPrefix refuses a bare numeric id as a prefix', () => {
    assert.strictEqual(S.customIdPrefix(RAW_ID), null);
});

// --- clampDetail ----------------------------------------------------------------------------
check('clampDetail keeps at most 8 keys', () => {
    const wide = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`k${i}`, i]));
    assert.strictEqual(Object.keys(S.clampDetail(wide)).length, S.DETAIL_MAX_KEYS);
});
check('clampDetail drops non-scalar values rather than serialising an object into detail', () => {
    const out = S.clampDetail({ ok: 1, nested: { a: 1 }, arr: [1, 2], fn: () => {} });
    assert.deepStrictEqual(Object.keys(out), ['ok']);
});
check('clampDetail keeps the serialised size under the 512-byte bound', () => {
    const out = S.clampDetail({ a: 'x'.repeat(300), b: 'y'.repeat(300), c: 'z'.repeat(300) });
    assert.ok(JSON.stringify(out).length <= S.DETAIL_MAX_BYTES);
});

// --- entry / installType / isAdmin ----------------------------------------------------------
const fakeInteraction = (over = {}) => ({
    id: '999', guildId: '123456789012345678', user: { id: RAW_ID },
    isAutocomplete: () => false, isModalSubmit: () => false, isButton: () => false,
    isAnySelectMenu: () => false, isStringSelectMenu: () => false, isChatInputCommand: () => false,
    ...over,
});
check('deriveEntry names each interaction type', () => {
    assert.strictEqual(S.deriveEntry(fakeInteraction({ isChatInputCommand: () => true })), 'slash');
    assert.strictEqual(S.deriveEntry(fakeInteraction({ isButton: () => true })), 'button');
    assert.strictEqual(S.deriveEntry(fakeInteraction({ isAnySelectMenu: () => true })), 'select');
    assert.strictEqual(S.deriveEntry(fakeInteraction({ isModalSubmit: () => true })), 'modal');
    assert.strictEqual(S.deriveEntry(fakeInteraction({ isAutocomplete: () => true })), 'autocomplete');
    assert.strictEqual(S.deriveEntry(fakeInteraction({ __dioreoSynthetic: true })), 'synthetic');
});
check('deriveInstallType reads discord.js 14.27 AuthorizingIntegrationOwners and the raw API shape', () => {
    assert.strictEqual(S.deriveInstallType(fakeInteraction({ authorizingIntegrationOwners: { guildId: '1', userId: null } })), 'guild');
    assert.strictEqual(S.deriveInstallType(fakeInteraction({ authorizingIntegrationOwners: { guildId: null, userId: '2' } })), 'user');
    assert.strictEqual(S.deriveInstallType(fakeInteraction({ authorizingIntegrationOwners: { '1': '2' } })), 'user');
    assert.strictEqual(S.deriveInstallType(fakeInteraction()), null, 'absent field must be null, never a throw');
});
check('isAdminSurface flags the admin commands so /bot usage never distorts product stats', () => {
    assert.strictEqual(S.isAdminSurface('manage', null), true);
    assert.strictEqual(S.isAdminSurface(null, 'mng'), true);
    assert.strictEqual(S.isAdminSurface('gunsmiths', 'colors'), false);
});

// --- 🔴 THE HIGHEST-VALUE TEST ------------------------------------------------------------- The one property the entire privacy design rests on. A string search, not a field-by-field review: the realistic regression is not somebody adding a `discordId` field (a schema review catches that instantly) -- it is a detail value that happens to carry one, or a customIdPrefix capture that grabs a segment embedding a user snowflake. Neither survives this.
check('THE RAW DISCORD ID NEVER APPEARS ANYWHERE IN A FINISHED EVENT DOCUMENT', () => {
    const ctx = { interactionId: '1', command: 'colors', handler: 'colors', userHash: hashUserId(RAW_ID), startedAt: Date.now() };
    const doc = S.buildEventDocument(
        fakeInteraction({ isButton: () => true, customId: `mng_admin_${RAW_ID}` }),
        ctx,
        { outcome: 'ok', ackMs: 12, durationMs: 340, detail: { area: 'colors_panel', leaky: RAW_ID }, deps: [{ name: 'atlas', ms: 8, calls: 3, ok: true }] },
        RAW_ID,
    );
    assert.ok(doc, 'a scrubbable document must still be stored, not discarded');
    assert.ok(!JSON.stringify(doc).includes(RAW_ID), `raw Discord id leaked into the event document: ${JSON.stringify(doc)}`);
    assert.ok(/^[0-9a-f]{64}$/.test(doc.userHash), 'userHash must be a real hex HMAC');
});
check('the scrub survives a raw id hidden in EVERY leakable field at once', () => {
    const ctx = { command: 'x', userHash: hashUserId(RAW_ID), startedAt: Date.now() };
    const doc = S.buildEventDocument(
        fakeInteraction({ isButton: () => true, customId: `${RAW_ID}_thing` }),
        ctx,
        { detail: { a: RAW_ID }, search: { term: RAW_ID } },
        RAW_ID,
    );
    assert.ok(!JSON.stringify(doc || {}).includes(RAW_ID));
});
check('guildId IS stored raw -- deliberately, and the scrub must not remove it', () => {
    const ctx = { command: 'x', userHash: hashUserId(RAW_ID), startedAt: Date.now() };
    const doc = S.buildEventDocument(fakeInteraction({ isChatInputCommand: () => true }), ctx, {}, RAW_ID);
    assert.strictEqual(doc.guildId, '123456789012345678');
});
check('containsRawId is a deep string search, not a field-name check', () => {
    assert.strictEqual(S.containsRawId({ a: { b: [`x${RAW_ID}y`] } }, RAW_ID), true);
    assert.strictEqual(S.containsRawId({ a: 1 }, RAW_ID), false);
    assert.strictEqual(S.containsRawId({ a: RAW_ID }, null), false);
});

// --- outcome capture ------------------------------------------------------------------------
check('markOutcome writes onto the live async context and the FIRST writer wins', () => {
    runWithContext({ command: 'x' }, () => {
        S.markOutcome('swallowed_by_cooldown');
        S.markOutcome('error');
        assert.strictEqual(require('../utils/requestContext').getContext().outcome, 'swallowed_by_cooldown');
    });
});
check('noteDep aggregates per dependency NAME, not per call', () => {
    runWithContext({ command: 'x' }, () => {
        S.noteDep('atlas', 5); S.noteDep('atlas', 7); S.noteDep('cloudinary', 100, false);
        const deps = require('../utils/requestContext').getContext().deps;
        assert.strictEqual(deps.length, 2);
        assert.deepStrictEqual(deps[0], { name: 'atlas', ms: 12, calls: 2, ok: true });
        assert.strictEqual(deps[1].ok, false, 'one failed call must mark the whole dependency row failed');
    });
});
check('markOutcome and noteDep are no-ops outside an interaction context, never throws', () => {
    S.markOutcome('error'); S.noteDep('atlas', 5); S.mergeDetail({ a: 1 });
});

check('the stored deps array is a COPY, so later instrumentation cannot mutate a queued document', () => {
    // notePicked() fires from inside the router's own finally and triggers a SearchTerm upsert, which goes through the timed Mongoose exec and calls noteDep() -- after the document was buffered. Aliasing the context's live array would have let that write itself into an already-queued row.
    const live = [{ name: 'atlas', ms: 5, calls: 1, ok: true }];
    const doc = S.buildEventDocument(fakeInteraction({ isChatInputCommand: () => true }),
        { command: 'x', userHash: hashUserId(RAW_ID), startedAt: Date.now() }, { deps: live }, RAW_ID);
    live[0].ms = 9999;
    live.push({ name: 'later', ms: 1, calls: 1, ok: true });
    assert.strictEqual(doc.deps.length, 1, 'a dep noted after the document was built must not appear in it');
    assert.strictEqual(doc.deps[0].ms, 5, 'a dep mutated after the document was built must not change it');
});

// --- the buffer's flush-on-error rule -------------------------------------------------------
function emit(outcome) {
    const before = inserted.length;
    runWithContext({ command: 'demo', userHash: hashUserId(RAW_ID), startedAt: Date.now(), outcome }, () => {
        const ctx = require('../utils/requestContext').getContext();
        S.recordInteractionEvent(fakeInteraction({ isChatInputCommand: () => true }), ctx, RAW_ID);
    });
    return before;
}
check('an ok event is BUFFERED, not written -- the response path never pays for a Mongo insert', () => {
    const before = emit('ok');
    assert.strictEqual(inserted.length, before, 'an ok event must not trigger an immediate write');
});
check('an error event FLUSHES IMMEDIATELY -- the moment an event is most worth having is right before a crash', async () => {
    emit('error');
    await new Promise(r => setImmediate(r));
    assert.ok(inserted.length >= 2, `flush-on-error did not fire (${inserted.length} written)`);
    assert.ok(inserted.some(d => d.outcome === 'error'), 'the error event itself must be in the flushed batch');
    assert.ok(inserted.some(d => d.outcome === 'ok'), 'the buffered ok event must ride along in the same batch');
});

// --- autocomplete debounce ------------------------------------------------------------------
check('autocomplete records ONE event per search session, not one per keystroke', async () => {
    const before = inserted.length;
    const typed = ['k', 'ki', 'kil', 'kilo'];
    runWithContext({ command: 'gunsmiths', userHash: hashUserId(RAW_ID), startedAt: Date.now() }, () => {
        for (const value of typed) {
            const ac = fakeInteraction({
                isAutocomplete: () => true, commandName: 'gunsmiths',
                options: { getFocused: () => ({ name: 'weapon', value }) },
                respond: async () => {},
            });
            S.instrumentAutocomplete(ac);
            ac.respond([]);   // zero results -- the alias-table case worth keeping
        }
    });
    assert.strictEqual(inserted.length, before, 'no event may be written while the user is still typing');
    S.flushSearchSessions();
    S.flushEvents();
    await new Promise(r => setImmediate(r));
    const events = inserted.slice(before).filter(d => d.entry === 'autocomplete');
    assert.strictEqual(events.length, 1, `expected exactly 1 session event for ${typed.length} keystrokes, got ${events.length}`);
    assert.strictEqual(events[0].search.keystrokes, typed.length);
    assert.strictEqual(events[0].search.term, 'kilo', 'the settled-on term is what survives');
    assert.strictEqual(events[0].search.results, 0);
    assert.ok(!JSON.stringify(events[0]).includes(RAW_ID), 'a search session event must not carry the raw id either');
});
check('a closed search session upserts the user-linkage-free aggregate row', () => {
    assert.ok(upserts.length >= 1, 'expected a SearchTerm upsert');
    const filter = upserts[upserts.length - 1].updateOne.filter;
    assert.deepStrictEqual(filter, { term: 'kilo', command: 'gunsmiths', field: 'weapon' });
    assert.ok(!JSON.stringify(filter).includes(RAW_ID), 'the aggregate must carry NO user linkage at all');
});

// --- SearchTerm buffer: bulkWrite, not a standalone round trip per closed session (finding #56) -- A closed search session now goes through the SAME buffer-then-flush discipline flushEvents() already used, and is flushed through the SAME shutdown call site (flushSearchSessions()) finding #12 already hooked into -- these two checks cover the shape of the buffered bulkWrite op and the FLUSH_AT auto-trigger, the two things a standalone-updateOne design could not offer at all.
function openAndCloseSearchSession(term, { command = 'gunsmiths', field = 'weapon' } = {}) {
    const userHash = hashUserId(`${RAW_ID}-${term}`);   // distinct per session so notePicked() only closes THIS one
    runWithContext({ command, userHash, startedAt: Date.now() }, () => {
        const ac = fakeInteraction({
            isAutocomplete: () => true, commandName: command,
            options: { getFocused: () => ({ name: field, value: term }) },
            respond: async () => {},
        });
        S.instrumentAutocomplete(ac);
        ac.respond([]);   // zero results, matching the existing autocomplete test above
    });
    S.notePicked(userHash, command);   // closes the session immediately -- the "search then run the command" signal, not the idle timer
}

check('a closed search session buffers a bulkWrite op shaped for the unique index, not a standalone updateOne', () => {
    const before = upserts.length;
    openAndCloseSearchSession('shapecheck');
    S.flushSearchSessions();
    assert.ok(upserts.length > before, 'expected at least one new buffered op');
    const op = upserts[upserts.length - 1];
    assert.deepStrictEqual(op.updateOne.filter, { term: 'shapecheck', command: 'gunsmiths', field: 'weapon' });
    // picked: 1 because openAndCloseSearchSession() closes via notePicked(), the real "search then run the command" signal -- that's what marks a session picked, by design.
    assert.deepStrictEqual(op.updateOne.update.$inc, { searches: 1, zeroResults: 1, picked: 1 });
    assert.ok(op.updateOne.update.$min.firstSeen instanceof Date, 'firstSeen must be set via $min for the upsert path');
    assert.ok(op.updateOne.update.$max.lastSeen instanceof Date, 'lastSeen must be set via $max');
    assert.strictEqual(op.updateOne.upsert, true);
});

check('the SearchTerm buffer auto-flushes at FLUSH_AT -- the same threshold the event buffer uses -- with no explicit flushSearchSessions() call', () => {
    const callsBefore = bulkWriteCalls;
    const opsBefore = upserts.length;
    for (let i = 0; i < S.FLUSH_AT; i++) openAndCloseSearchSession(`auto${i}`);
    assert.strictEqual(bulkWriteCalls, callsBefore + 1, 'expected exactly one auto-triggered bulkWrite once the buffer reached FLUSH_AT');
    assert.strictEqual(upserts.length, opsBefore + S.FLUSH_AT, 'the auto-flush must carry every buffered op, not a partial batch');
});

// --- flushAllForShutdown(): the memoization that closes the TWO-LISTENER race (finding #56) ------ installShutdownFlush() and instanceLock.js's releaseLock both register on the same signal and both used to call flushSearchSessions()/flushEvents() directly -- whichever ran second found the buffers already drained and resolved via a hollow, instantly-resolved promise instead of the real in-flight write. This proves the fix: two callers on the same shutdown get the SAME promise.
check('flushAllForShutdown() memoizes the shutdown flush -- a second caller gets the SAME in-flight promise, not a hollow one', async () => {
    openAndCloseSearchSession('memocheck');   // leaves one buffered SearchTerm op pending
    const callsBefore = bulkWriteCalls;
    const p1 = S.flushAllForShutdown();
    const p2 = S.flushAllForShutdown();   // simulates the SECOND listener on the same signal
    assert.strictEqual(p1, p2, 'a second caller on the same shutdown must await the SAME promise the first call kicked off');
    await p1;
    assert.strictEqual(bulkWriteCalls, callsBefore + 1, 'the buffered op must be flushed exactly once, not once per listener');
});

(async () => {
    for (const [name, fn] of checks) {
        try { await fn(); console.log(`  ✓ ${name}`); }
        catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
    }
    if (failures > 0) { console.error(`❌ eventStore: ${failures} case(s) failed`); process.exit(1); }
    console.log(`✅ eventStore: ${checks.length} cases passed`);
    process.exit(0);
})();
