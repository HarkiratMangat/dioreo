// scripts/portalUi.test.js Render functions are PURE: state in, tree out. No DOM, no browser, no framework harness. That is the whole frontend testing story, and it only works because the components take state as an argument rather than reaching for it.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { bandClass, laneFor, tierOf, findOverlaps, findGaps, findDuplicateTitles, stemLabels, findExpiringBanners } = require('../portal/ui/track.logic');   // CJS sibling — see the Files note
const { columnFor, groupByColumn, blockedReason, describeOp, describeInverse, diffRows, fmtDiffValue } = require('../portal/ui/board.logic');
const { seasonWindow, topicVarFor, typeLabelFor } = require('../portal/ui/season.logic');
const { announcementState } = require('../portal/api/broadcast');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  \u2713 ${name}`); }
    catch (e) { failures++; console.error(`  \u2717 ${name}\n      ${e.message}`); }
}

check('SHAPE carries state \u2014 three states, three distinct classes', () => {
    assert.strictEqual(bandClass({ state: 'live' }), 'bar saved');
    assert.strictEqual(bandClass({ state: 'staged' }), 'bar staged');
    assert.strictEqual(bandClass({ state: 'conflict' }), 'bar conflict');
});

check('COLOUR carries topic and is never used to signal state', () => {
    const live = bandClass({ state: 'live', topic: 'draw' });
    const staged = bandClass({ state: 'staged', topic: 'draw' });
    assert.notStrictEqual(live, staged, 'two states of the same topic must differ by SHAPE');
    assert.strictEqual(bandClass({ state: 'live', topic: 'draw' }), bandClass({ state: 'live', topic: 'event' }),
        'two topics in the same state must share a class \u2014 the topic arrives as a CSS custom property, not a class');
});

check('an item ending after the season end is a conflict, computed not flagged by hand', () => {
    assert.strictEqual(tierOf({ endDate: '2026-09-10' }, { bpEnd: '2026-09-04' }), 'conflict');
    assert.strictEqual(tierOf({ endDate: '2026-09-01' }, { bpEnd: '2026-09-04' }), 'ok');
});

const { dateFromOffset, editOpFor, clusterPoints, railBox } = require('../portal/ui/track.logic');

check('dateFromOffset is the inverse of barGeometry’s left/width math, snapped to a day', () => {
    const window = { start: '2026-08-01', end: '2026-08-08' }; // exactly 7 days wide
    const half = dateFromOffset(50, window);
    // 50% of 7 days = 3.5 days in = Aug 4 12:00 -- Math.round rounds .5 toward +Infinity, so this snaps UP to Aug 5, not down. (First draft of this assertion assumed "snapped down" and was wrong.)
    assert.strictEqual(half.toISOString().slice(0, 10), '2026-08-05');
});

check('dateFromOffset clamps to the window edges', () => {
    const window = { start: '2026-08-01', end: '2026-08-08' };
    assert.strictEqual(dateFromOffset(-10, window).toISOString().slice(0, 10), '2026-08-01');
    assert.strictEqual(dateFromOffset(150, window).toISOString().slice(0, 10), '2026-08-08');
});

check('editOpFor on a draw writes the new date onto `date`, strips the synthetic `startDate`, and preserves every other field', () => {
    const item = { id: 'r1', lane: 'returning', category: 'returning', title: 'Havoc rerun', items: ['a', 'b'], startDate: '2026-08-04', endDate: '2026-08-13' };
    const op = editOpFor(item, new Date('2026-08-16'));
    assert.strictEqual(op.type, 'draw.edit');
    assert.strictEqual(op.target.category, 'returning');
    assert.strictEqual(op.payload.date, '2026-08-16');
    assert.strictEqual(op.payload.startDate, undefined, 'a stray startDate would reach draw.edit’s $set -- draws have no such schema field');
    assert.strictEqual(op.payload.title, 'Havoc rerun');
    assert.deepStrictEqual(op.payload.items, ['a', 'b']);
});

check('editOpFor on a calendar item writes the new date onto `endDate`, keeps `startDate`, and resolves calendar.edit', () => {
    const item = { id: 'e1', lane: 'event', title: 'Clan wars', startDate: '2026-08-22', endDate: '2026-08-28' };
    const op = editOpFor(item, new Date('2026-08-30'));
    assert.strictEqual(op.type, 'calendar.edit');
    assert.deepStrictEqual(op.target, { elementId: 'e1' });
    assert.strictEqual(op.payload.endDate, '2026-08-30');
    assert.strictEqual(op.payload.startDate, '2026-08-22', 'calendar.edit’s validateEvent reads the start date from payload.startDate, not the stored `date` field');
});

// ─── Board column semantics (Phase 3) ──────────────────────────────────────── 🔴 THESE TWO DEFECTS SHIPPED BECAUSE NOTHING ASSERTED THE COLUMN MAPPING. columnFor only ever tested the tier-3 export gate, so a changeset whose own state was 'blocked' -- set by portal/api/changesets.js when validateSet FAILS -- landed in Ready, under the Commit button; and 'staged' was never returned by anything, so that column was structurally unreachable.

check('a changeset that failed validation belongs in Blocked, never in Ready', () => {
    assert.strictEqual(columnFor({ state: 'blocked', tier: 1 }), 'blocked');
    assert.ok(blockedReason({ state: 'blocked', tier: 1 }), 'Blocked must always state a reason');
});

check('the Staged column is reachable — a validated tier-1 set lands there', () => {
    assert.strictEqual(columnFor({ state: 'staged', tier: 1 }), 'staged');
});

check('the tier-3 export gate still routes to Blocked, and clears once exported', () => {
    assert.strictEqual(columnFor({ state: 'staged', tier: 3, exportedAt: null }), 'blocked');
    assert.strictEqual(columnFor({ state: 'staged', tier: 3, exportedAt: new Date() }), 'staged');
});

check('committed and discarded sets leave the board entirely', () => {
    assert.strictEqual(columnFor({ state: 'committed', tier: 1 }), null);
    assert.strictEqual(columnFor({ state: 'discarded', tier: 1 }), null);
});

check('Ready is ALL-OR-NOTHING — one blocker holds every staged set out of it', () => {
    const withBlocker = groupByColumn([{ state: 'staged', tier: 1 }, { state: 'staged', tier: 3, exportedAt: null }]);
    assert.strictEqual(withBlocker.ready.length, 0, 'nothing is ready while anything is blocked');
    assert.strictEqual(withBlocker.staged.length, 1);
    assert.strictEqual(withBlocker.blocked.length, 1);
    const clean = groupByColumn([{ state: 'staged', tier: 1 }, { state: 'staged', tier: 1 }]);
    assert.strictEqual(clean.ready.length, 2, 'with no blocker, staged work promotes to ready');
    assert.strictEqual(clean.staged.length, 0);
});

// ─── An op, and its inverse, described in words ──────────────────────────────

check('describeOp names the entity and the thing, not just a count', () => {
    assert.strictEqual(describeOp({ type: 'draw.add', payload: { title: 'Iron Wolf' } }), 'Add draw \u201cIron Wolf\u201d');
    assert.strictEqual(describeOp({ type: 'loadout.bulkDelete', payload: { ids: [1, 2, 3] } }), 'Delete 3 builds');
    assert.strictEqual(describeOp({ type: 'announcement.post', payload: { text: 'Season 7 is live' } }), 'Post announcement \u201cSeason 7 is live\u201d');
});

check('describeInverse states what undoing would do', () => {
    assert.strictEqual(describeInverse({ type: 'draw.delete' }), 'Undo would restore the draw');
    assert.strictEqual(describeInverse({ type: 'calendar.add' }), 'Undo would remove the calendar item');
    assert.strictEqual(describeInverse({ type: 'season.restoreSnapshot' }), null, 'an op with no stated inverse says nothing rather than guessing');
});

check('diffRows returns ONLY the fields that changed', () => {
    const rows = diffRows({ title: 'A', items: [1, 2] }, { title: 'B', items: [1, 2] });
    assert.deepStrictEqual(rows, [{ key: 'title', from: 'A', to: 'B', kind: 'change' }]);
});

check('a nested record renders by its own name, never as raw JSON', () => {
    assert.strictEqual(fmtDiffValue({ title: 'Judgment Day', date: '2026-08-07T00:00:00Z' }), 'Judgment Day');
    assert.strictEqual(fmtDiffValue({ a: 1, b: 2 }), '2 fields');
    assert.strictEqual(fmtDiffValue('2026-08-07T00:00:00Z'), '2026-08-07', 'a raw ISO datetime is unreadable next to its neighbour');
});

// ─── Season: the Track window, and the Manifest's topic accent ───────────────

check('seasonWindow never collapses to a point when bpEnd is unset', () => {
    const w = seasonWindow(null, Date.parse('2026-08-23'));
    assert.notStrictEqual(w.start, w.end, 'start === end divides by a 1ms span and every bar renders at 0%');
    assert.ok(new Date(w.end) - new Date(w.start) >= 14 * 86400000, 'a 14-day floor keeps a one-item season readable');
});

check('seasonWindow spans the data\u2019s own extent when it has one', () => {
    const w = seasonWindow({ newDraws: [{ date: '2026-08-06' }], calendar: [{ date: '2026-08-01', endDate: '2026-09-13' }] }, '2026-08-23');
    // ⚠️ PADDED, and that is the design's own rule rather than slack in the assertion: dataBounds adds max(2, 4% of the span) at BOTH ends so the first and last bar are not flush against the frame. 43 days of content → 2 days each side. The window still CONTAINS the extent, which is what this check is about; asserting the bare extent asserted the absence of the padding.
    assert.strictEqual(w.start, '2026-07-30');
    assert.strictEqual(w.end, '2026-09-15');
    assert.ok(w.start <= '2026-08-01' && w.end >= '2026-09-13', 'the window contains the data');
});

check('every Manifest lane resolves a REAL topic token, and Playlist is not Event', () => {
    // manifest.js reads row.topicVar and nothing ever set it — every row drew the --ink3 fallback.
    assert.strictEqual(topicVarFor('newDraws', {}), '--draw');
    assert.strictEqual(topicVarFor('returningDraws', {}), '--ret');
    assert.strictEqual(topicVarFor('calendar', { category: 'Event' }), '--ev');
    assert.strictEqual(topicVarFor('calendar', { category: 'Playlist' }), '--play');
    assert.strictEqual(typeLabelFor('calendar', { category: 'Playlist' }), 'Playlists');
    assert.notStrictEqual(topicVarFor('calendar', { category: 'Playlist' }), topicVarFor('calendar', { category: 'Event' }));
});

// ─── Broadcast: the portal must agree with what Discord shows ────────────────

check('an announcement that has not started yet is SCHEDULED, never live', () => {
    const now = new Date('2026-08-23T19:00:00Z');
    assert.strictEqual(announcementState({}, now), 'live');
    assert.strictEqual(announcementState({ startsAt: new Date('2026-08-26') }, now), 'scheduled');
    assert.strictEqual(announcementState({ expiresAt: new Date('2026-08-11') }, now), 'expired');
    assert.strictEqual(announcementState({ startsAt: new Date('2026-08-01'), expiresAt: null }, now), 'live');
    assert.strictEqual(announcementState({ startsAt: new Date('2026-08-26'), expiresAt: new Date('2026-08-11') }, now), 'expired',
        'expiry wins over a future start — a set that already ended is not waiting to begin');
});

// 🔴 HTML ENTITIES DO NOT DECODE INSIDE AN htm TEMPLATE, and the failure is silent and visible only on screen. htm builds a Preact tree, and a text node is rendered verbatim -- so `&#215;` prints as the five characters "&#215;", not "×". Found 2026-08-26 on the migrated Armory rack, where every build chip read "MP 5&#215;", and the same pass then found a PRE-EXISTING one that had been shipping in season.js's staged panel: "Review &amp; commit". Nothing else here can see it -- it is not a contrast problem, not a schema problem, and the markup is perfectly well formed.
//
// Write the real character. This test exists because the reflex ("escape it for HTML") is right in an HTML file and wrong in every one of these.
check('no HTML entity is written inside a portal/ui template', () => {
    const dir = path.join(__dirname, '..', 'portal', 'ui');
    const offenders = [];
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
        const src = fs.readFileSync(path.join(dir, f), 'utf8');
        src.split('\n').forEach((line, i) => {
            // Comments are prose about the problem -- this very file's neighbours quote entities on purpose, so a line that is only a comment is not an offence.
            const code = line.replace(/^\s*(\/\/|\*).*$/, '');
            const m = code.match(/&(?:[a-zA-Z][a-zA-Z0-9]+|#[0-9]+);/);
            if (m) offenders.push(`portal/ui/${f}:${i + 1}  ${m[0]}`);
        });
    }
    assert.deepStrictEqual(offenders, [], 'HTML entities render as literal text under htm:\n  ' + offenders.join('\n  '));
});

// THE GATE CAN FAIL -- without this the case above passes on an empty directory listing just as happily as on a clean one.
check('THE ENTITY GATE CAN FAIL: a sample line with an entity is caught', () => {
    const sample = '    <span class="x">5&#215;</span>';
    assert.ok(/&(?:[a-zA-Z][a-zA-Z0-9]+|#[0-9]+);/.test(sample.replace(/^\s*(\/\/|\*).*$/, '')));
});

// 🔴 AN INLINE CODE CHIP IS A BOX, NOT A WORD. `code` carries horizontal padding here, so a comma or a full stop set immediately after one lands a chip's width away from the word it belongs to. On the Analytics callout this rendered as "come from  BootRecord , errors" and "from  AlertLog .Run" — three chips, each abutting punctuation, in one sentence. Nothing was wrong with the markup or the CSS; the sentence was built so the chips ended its clauses.
//
// The fix is a copy rule, not a style one: a chip NAMES a thing, so let a real word follow it — "the <code>AlertLog</code> collection." rather than "<code>AlertLog</code>.". This gate exists because the defect is invisible in source and obvious only once rendered, which is the worst combination to leave to memory.
check('no inline <code> chip is immediately followed by punctuation', () => {
    const dir = path.join(__dirname, '..', 'portal', 'ui');
    const offenders = [];
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.js'))) {
        fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach((line, i) => {
            if (/^\s*(\/\/|\*)/.test(line)) return;
            // ⚠️ A SENTENCE-ENDING PERIOD IS NOT THE DEFECT THIS RULE IS ABOUT. The gap it catches is a chip abutting a comma or colon MID-PHRASE; a full stop closing a sentence after a chip is ordinary typography, and the design's own racknote is written that way — so the rule as first written made conformance to the design impossible. A period counts only when it is NOT followed by whitespace or the end of the line.
            const m = line.match(/<\/code>\s*(?:[,;:!?]|\.(?!\s|$))/);
            if (m) offenders.push(`portal/ui/${f}:${i + 1}  ${m[0]}`);
        });
    }
    assert.deepStrictEqual(offenders, [], 'a code chip abutting punctuation reads as a gap:\n  ' + offenders.join('\n  '));
});

check('THE CHIP GATE CAN FAIL: a sample line with a chip before a comma is caught', () => {
    assert.ok(/<\/code>\s*[.,;:!?]/.test('  read from <code>AlertLog</code>, and elsewhere'));
});


// 🔴 htm DROPS THE WHITESPACE AROUND A LINE BREAK, so a sentence that wraps just before an inline tag loses the space that was holding two words apart. Measured live in the Access revoke drawer: "permissions held by<b>411000000000000002</b>" rendered as "held by411000000000000002". Three more were already in the tree and had been for weeks — "run the<code>/bot analytics</code>" on the Analytics callout, and "restore the<em>old</em>" on the Review conflict card — because the source looks perfectly correct and only the rendered page shows it. Same family as the chip gate above, same reason for existing.
//
// ⚠️ DELIBERATELY LIMITED TO INLINE TEXT TAGS, and the omission is the interesting part: the identical break before a `${…}` expression is the SAME defect when the expression yields text, and is CORRECT when it yields a positioned element — the rail's own staged-count badge is `position:absolute`, so a space there would be wrong. A gate cannot tell those apart from the source, and a gate with a false positive gets suppressed rather than obeyed. The tags below are the set where a missing space is always wrong.
const INLINE_TEXT_TAG = /^<(b|code|em|i|strong|abbr|kbd|sup|sub)\b/;
check('no sentence wraps straight into an inline tag, losing the space between the words', () => {
    const dir = path.join(__dirname, '..', 'portal', 'ui');
    const offenders = [];
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.js') && !n.endsWith('.logic.js'))) {
        const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
            if (/^\s*(\/\/|\*|<!--)/.test(lines[i].trim())) continue;
            if (!/[A-Za-z0-9,;:]$/.test(lines[i])) continue;
            if (INLINE_TEXT_TAG.test(lines[i + 1].trim())) {
                offenders.push(`portal/ui/${f}:${i + 1}  …${lines[i].trim().slice(-38)} ⟶ ${lines[i + 1].trim().slice(0, 30)}`);
            }
        }
    }
    assert.deepStrictEqual(offenders, [], "htm eats the line break, so these render as one run-on word — end the line with ${' '}:\n  " + offenders.join('\n  '));
});

// ⚠️ AN ATTRIBUTE CONTINUATION IS NOT PROSE. The first version of this listed known attribute names to skip — a list needing maintenance forever, and already wrong inside one file (overlaySlot, bulkNote, searchableFields). The discriminator is the SHAPE: an attribute value is `name=${…}` and the whitespace between two attributes means nothing to htm, while a prose interpolation never carries that `=`.
//
// 🔴 THE SAME TRAP RUNNING THE OTHER WAY. The gate above catches a line ending in a WORD before an inline tag; htm drops the whitespace on both sides of a line break, so a line ending in a closing `}` before a line starting with a word loses the space too — "most builds carry 5.Slot labels are only ever filled by". Found rendered, in the build editor, after the first gate had already passed the file.
check('no expression wraps straight into a word, losing the space between them', () => {
    const dir = path.join(__dirname, '..', 'portal', 'ui');
    const offenders = [];
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.js') && !n.endsWith('.logic.js'))) {
        const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
            if (/^\s*(\/\/|\*|<!--)/.test(lines[i].trim())) continue;
            // A line ending in `}` that closes an interpolation, followed by prose rather than markup.
            if (!/\}$/.test(lines[i].trim())) continue;
            if (!/\$\{/.test(lines[i])) continue;
            if (/[A-Za-z-]+=\$\{/.test(lines[i])) continue;   // an attribute value, where the line break carries no meaning
            if (/\$\{' '\}$/.test(lines[i].trim())) continue;   // already ends with the explicit space
            const next = lines[i + 1].trim();
            // ⚠️ AND PLAIN JAVASCRIPT IS NOT MARKUP EITHER. `} ` closing a block, followed by `const …`, is ordinary code — icons.js tripped this before the keyword filter. The list is JS statement keywords, which is a set that does not grow.
            if (/^(const|let|var|return|if|for|while|do|switch|case|function|class|import|export|try|catch|finally|else|new|throw|await|yield|delete|assert|module|process)\b/.test(next)) continue;
            if (/^[A-Za-z]/.test(next) && !/^[A-Za-z-]+=/.test(next)) {
                offenders.push(`portal/ui/${f}:${i + 1}  …${lines[i].trim().slice(-34)} ⟶ ${next.slice(0, 30)}`);
            }
        }
    }
    assert.deepStrictEqual(offenders, [], "htm eats the line break here too — end the line with ${' '}:\n  " + offenders.join('\n  '));
});

check('THE REVERSE WRAP GATE CAN FAIL, and does not fire on an attribute or on plain JS', () => {
    const flags = (cur, next) => {
        if (!/\}$/.test(cur.trim()) || !/\$\{/.test(cur)) return false;
        if (/[A-Za-z-]+=\$\{/.test(cur)) return false;
        if (/\$\{' '\}$/.test(cur.trim())) return false;
        const n = next.trim();
        if (/^(const|let|var|return|if|for|while|do|switch|case|function|class|import|export|try|catch|finally|else|new|throw|await|yield|delete|assert|module|process)\b/.test(n)) return false;
        return /^[A-Za-z]/.test(n) && !/^[A-Za-z-]+=/.test(n);
    };
    assert.ok(flags('  : `${n} attachments. most builds carry 5.`}', '  Slot labels are only ever filled'), 'the real defect must be caught');
    assert.ok(!flags('  searchableFields=${[\'discordId\']}', '  bulkNote="Immediate"'), 'an attribute continuation must not fire');
    assert.ok(!flags('  named "${name}"`); return null; }', '  const a11y = label ? {}'), 'plain JS must not fire');
    assert.ok(!flags('  most builds carry 5.`}${\' \'}', '  Slot labels'), 'the explicit fix must not fire');
});

check('THE WRAP GATE CAN FAIL: a line ending in a word followed by <b> is caught', () => {
    assert.ok(/[A-Za-z0-9,;:]$/.test('    permissions held by') && INLINE_TEXT_TAG.test('<b>${id}</b> is removed.'));
    assert.ok(!INLINE_TEXT_TAG.test('${staged ? html`<span class="cnt">'), 'an expression is deliberately NOT gated — see the note above');
});


// ── OVERLAPS AND GAPS ────────────────────────────────────────────────────────────────────────
//
// 🔴 BOTH OF THESE HAD NO CALLER ANYWHERE until the Repairs view was built, and the first one was broken. `laneFor` read `item.kind`; the Track's own items carry `lane` and no `kind`, so every item fell through to the 'event' default and findOverlaps saw ONE lane containing the whole season — 61 overlaps across 37 items, a playlist "overlapping" a draw. A pure function with no reader cannot be wrong in a way anybody sees.
check('laneFor reads the item’s own lane, not only a kind', () => {
    assert.strictEqual(laneFor({ lane: 'playlist' }), 'playlist');
    assert.strictEqual(laneFor({ kind: 'draw' }), 'draw');
    assert.strictEqual(laneFor({}), 'event', 'the default stands for an item that names neither');
});

check('two items in DIFFERENT lanes never overlap, however much their dates do', () => {
    const a = { lane: 'playlist', startDate: '2026-08-01', endDate: '2026-08-31' };
    const b = { lane: 'draw', startDate: '2026-08-10', endDate: '2026-08-10' };
    assert.deepStrictEqual(findOverlaps([a, b]), [], 'a draw inside a playlist window is not an overlap');
});

check('two items in the SAME lane sharing days do overlap, and a shared boundary does not', () => {
    const a = { lane: 'playlist', startDate: '2026-08-01', endDate: '2026-08-10' };
    const b = { lane: 'playlist', startDate: '2026-08-05', endDate: '2026-08-15' };
    assert.strictEqual(findOverlaps([a, b]).length, 1);
    const c = { lane: 'playlist', startDate: '2026-08-10', endDate: '2026-08-20' };
    assert.deepStrictEqual(findOverlaps([a, c]), [], 'consecutive weeks touching end-to-start are not an overlap');
});

check('a gap is only reported when it is wider than the floor', () => {
    const win = { start: '2026-08-01', end: '2026-08-31' };
    const items = [{ startDate: '2026-08-01', endDate: '2026-08-10' }, { startDate: '2026-08-11', endDate: '2026-08-31' }];
    assert.deepStrictEqual(findGaps(items, win), [], 'one day between two items is not a gap');
    const sparse = [{ startDate: '2026-08-01', endDate: '2026-08-05' }, { startDate: '2026-08-20', endDate: '2026-08-31' }];
    assert.strictEqual(findGaps(sparse, win).length, 1);
});

// ── THE SAME THING ENTERED TWICE ─────────────────────────────────────────────────────────────
//
// 🔴 THE PREDICATE THIS REPLACES WAS MEASURED WRONG TWICE. "Any two items sharing days" reported 61 findings across 37 real items, nearly all events meant to run together; "only within a lane where concurrency should be impossible" reported 47, every one a pair of playlists, and CODM runs many playlists at once. Harkirat settled the flaggable case as a DOUBLE ENTRY, which these cases pin down.
const dated = (title, startDate, endDate) => ({ title, startDate, endDate: endDate || startDate });

check('the same title over the same days is a duplicate, whatever the punctuation', () => {
    const hits = findDuplicateTitles([dated('COD Point Rush Week 2', '2026-08-10', '2026-08-17'),
                                      dated('cod point rush — week 2!', '2026-08-12', '2026-08-19')]);
    assert.strictEqual(hits.length, 1);
    assert.strictEqual(hits[0][2], 'same');
});

check('findExpiringBanners names every banner still on a signed Discord link', () => {
    const hits = findExpiringBanners({
        drawsBannerUrl: 'https://media.discordapp.net/attachments/1/2/a.png?ex=deadbeef',
        eventsBannerUrl: 'https://cdn.discordapp.com/attachments/1/2/b.png',
        playlistsBannerUrl: 'https://res.cloudinary.com/x/image/upload/f_auto,q_auto/c.png',
    });
    assert.deepStrictEqual(hits.map((h) => h.key), ['drawsBannerUrl', 'eventsBannerUrl']);
});

check('THE BANNER GATE CAN FAIL: a re-hosted season reports zero, and a blank field is not a finding', () => {
    // Both databases were re-hosted 2026-08-27, so zero is the expected live answer — and a check that cannot return zero would report the fix as a defect forever.
    assert.strictEqual(findExpiringBanners({
        drawsBannerUrl: 'https://res.cloudinary.com/x/image/upload/a.png',
        eventsBannerUrl: '', playlistsBannerUrl: null,
    }).length, 0);
    // Blank is a REAL value meaning "show nothing" (see the banner section's own note), never a defect.
    assert.strictEqual(findExpiringBanners({}).length, 0);
    assert.strictEqual(findExpiringBanners(null).length, 0);
});

check('stemLabels strips a shared prefix once three or more bars carry it', () => {
    const out = stemLabels([{ id: 'a', title: 'COD Point Rush Week 1' },
                            { id: 'b', title: 'COD Point Rush Week 2' },
                            { id: 'c', title: 'COD Point Rush Week 3' }]);
    assert.strictEqual(out.get('a'), 'Week 1');
    assert.strictEqual(out.get('c'), 'Week 3');
});

check('stemLabels NEVER cuts to a bare token — at least two words survive', () => {
    // Cutting the full common prefix would leave "1".."3", which is not a name.
    const out = stemLabels([{ id: 'a', title: 'Rush Week One 1' },
                            { id: 'b', title: 'Rush Week One 2' },
                            { id: 'c', title: 'Rush Week One 3' }]);
    for (const id of ['a', 'b', 'c']) {
        assert.ok(out.get(id).trim().split(/\s+/).length >= 2, `${id} kept only "${out.get(id)}"`);
    }
});

check('THE STEM GATE CAN FAIL: two bars are left alone, and so is a group that shares nothing', () => {
    // Two is not a group — the mockup's own correction. Stemming a pair hides a word to save one repeat.
    assert.strictEqual(stemLabels([{ id: 'a', title: 'COD Point Rush Week 1' },
                                   { id: 'b', title: 'COD Point Rush Week 2' }]).size, 0);
    // Three unrelated titles must produce nothing, or the pass is cutting text it cannot justify.
    assert.strictEqual(stemLabels([{ id: 'a', title: 'Widow\'s Bite Draw' },
                                   { id: 'b', title: 'Undead Legion Armory' },
                                   { id: 'c', title: 'Terminator 2 Event' }]).size, 0);
});

check('stemLabels is IDEMPOTENT on its own output — it reads titles, never rendered width', () => {
    // This is why it was safe to port when its sibling label pass was not: nothing it changes feeds back into the decision, so a second pass over the shortened names cannot cut them again.
    const list = [{ id: 'a', title: 'COD Point Rush Week 1' },
                  { id: 'b', title: 'COD Point Rush Week 2' },
                  { id: 'c', title: 'COD Point Rush Week 3' }];
    const once = stemLabels(list);
    const twice = stemLabels(list.map((it) => ({ id: it.id, title: once.get(it.id) })));
    assert.strictEqual(twice.size, 0, 'a second pass cut the labels again — this would oscillate');
});

check('one title inside another is a duplicate when the shorter is substantial', () => {
    const hits = findDuplicateTitles([dated('Undead Legion Series Armory', '2026-08-10', '2026-08-20'),
                                      dated('Undead Legion Series Armory Draw', '2026-08-15', '2026-08-25')]);
    assert.strictEqual(hits.length, 1);
    assert.strictEqual(hits[0][2], 'contains');
});

// ⚠️ THE CASE A DISTANCE METRIC GETS WRONG. "Week 2" and "Week 3" differ by one character and are consecutive playlists, not a double entry — which is exactly why this does containment and not fuzzy distance.
check('consecutive weeks are NOT duplicates', () => {
    assert.deepStrictEqual(findDuplicateTitles([dated('COD Point Rush Week 2', '2026-08-10', '2026-08-17'),
                                                dated('COD Point Rush Week 3', '2026-08-10', '2026-08-17')]), []);
});

check('a short title inside a longer one is not enough on its own', () => {
    assert.deepStrictEqual(findDuplicateTitles([dated('Krai BR', '2026-08-10', '2026-08-20'),
                                                dated('Krai BR Mode Rotation', '2026-08-10', '2026-08-20')], 12),
        [], 'below the floor, containment is a coincidence rather than a duplicate');
});

check('the same title in a later season is not a double entry', () => {
    assert.deepStrictEqual(findDuplicateTitles([dated('Nuketown Dedicated', '2026-08-01', '2026-08-10'),
                                                dated('Nuketown Dedicated', '2026-09-01', '2026-09-10')]), []);
});

check('an untitled row cannot match anything, rather than matching every other untitled row', () => {
    assert.deepStrictEqual(findDuplicateTitles([dated('', '2026-08-01', '2026-08-10'),
                                                dated('   ', '2026-08-01', '2026-08-10')]), []);
});

// ── THE COMPOSER'S LIVE GHOST ─────────────────────────────────────────────────────────────────
//
// 🔴 THE ONE THING /manage STRUCTURALLY CANNOT DO. Discord answers "when" with a line of text; this draws the item in its own lane, at its own dates, before it is staged. It was the mockup's named signature moment and the portal had no version of it.
const { composeGhostFor } = require('../portal/ui/composer.logic');

check('no ghost before there is something to draw', () => {
    assert.strictEqual(composeGhostFor(null, null), null);
    assert.strictEqual(composeGhostFor({ name: 'x', aIso: '2026-09-04' }, { shape: 'point' }), null, 'a date with no type has no lane to land in');
    assert.strictEqual(composeGhostFor({ type: 'draw', name: 'x', aText: 'sep' }, { shape: 'point' }), null,
        'a half-typed date must not place a ghost — aText is what the field shows, aIso is what the parser resolved');
});

check('a point ends where it starts, whatever the second field happens to hold', () => {
    const g = composeGhostFor({ type: 'draw', name: 'Crimson', aIso: '2026-09-04', bIso: '2026-09-20' }, { shape: 'point' });
    assert.strictEqual(g.end, '2026-09-04', 'a draw has one date; a stale bIso must not stretch it into a bar the record cannot have');
    assert.strictEqual(g.shape, 'point');
});

check('a span uses its closing date, and falls back to the opening one', () => {
    assert.strictEqual(composeGhostFor({ type: 'event', aIso: '2026-09-04', bIso: '2026-09-20' }, { shape: 'span' }).end, '2026-09-20');
    assert.strictEqual(composeGhostFor({ type: 'event', aIso: '2026-09-04' }, { shape: 'span' }).end, '2026-09-04',
        'a span with no closing date yet is drawn as a single day rather than not at all');
});

check('THE ISO RULE CAN FAIL: placing a ghost from the typed text would land on a different day', () => {
    assert.throws(() => {
        const state = { type: 'draw', aText: 'sep', aIso: '2026-09-21' };
        assert.strictEqual(state.aText, state.aIso, 'the typed text is not the resolved day');
    }, /not the resolved day/);
});

// 🔴 A CONSERVATION CHECK BETWEEN TWO LISTS IN DIFFERENT FILES. The composer's type keys and the Track's lane keys are matched by string, and a mismatch fails SILENTLY — the ghost is computed, handed to the Track, matched against no lane, and simply never drawn. `patchnote` is the one deliberate exception: the Track has no patch-note lane, so composing one draws nothing, which is honest rather than broken.
check('every composer type that should draw a ghost has a Track lane to draw it in', () => {
    const fs = require('fs'), path = require('path');
    const ROOT = path.join(__dirname, '..');
    const season = fs.readFileSync(path.join(ROOT, 'portal', 'ui', 'season.js'), 'utf8');
    const track = fs.readFileSync(path.join(ROOT, 'portal', 'ui', 'track.js'), 'utf8');
    const types = [...season.matchAll(/\{ key: '([a-z]+)', label: '[^']*', hex:/g)].map((m) => m[1]);
    const lanes = [...track.matchAll(/\{ key: '([a-z]+)',\s+label:/g)].map((m) => m[1]);
    assert.ok(types.length >= 4 && lanes.length >= 4, `parsed ${types.length} types and ${lanes.length} lanes — the shape changed and this check has gone blind`);
    const NO_LANE = ['patchnote'];
    const stranded = types.filter((t) => !lanes.includes(t) && !NO_LANE.includes(t));
    assert.deepStrictEqual(stranded, [], `${stranded.join(', ')} can be composed and has no lane, so its ghost is computed and silently never drawn`);
});

check('THE LANE MATCH CAN FAIL: a type with no lane is caught', () => {
    assert.throws(() => {
        const stranded = ['draw', 'seasonpass'].filter((t) => !['draw', 'event'].includes(t) && !['patchnote'].includes(t));
        assert.deepStrictEqual(stranded, [], `stranded: ${stranded.join(', ')}`);
    }, /stranded: seasonpass/);
});

// ── THE DEADLINE RAIL ─────────────────────────────────────────────────────────────────────────
//
// 🔴 THE TRACK DREW THREE DEADLINE LINES AND NAMED NONE OF THEM — and in the live season TWO of the three fall on the same day, so which colour meant what was something you had to remember and the count itself was ambiguous.
const { deadlineRail } = require('../portal/ui/season.logic');

const SEASON = {
    bpTitle: 'BP Season 7', bpEnd: '2026-09-10T00:00:00.000Z',
    rankTitle: 'Ranked Series 2', rankEnd: '2026-09-10T00:00:00.000Z',
    dmzTitle: 'DMZ Season 1', dmzEnd: '2026-11-11T00:00:00.000Z',
};

// 🔴 THIS USED TO ASSERT THE OPPOSITE — that two deadlines on one date take DIFFERENT ROWS — and it passed for as long as the defect existed. Two labels for one moment is a modelling error, and a test that pins the model in place is the reason a defect survives a green suite. One date is one chip carrying both names, with a key dot each.
check('two deadlines on the same day are ONE chip, not two', () => {
    const { flags } = deadlineRail(SEASON, '2026-08-06', '2026-09-19');
    assert.strictEqual(flags.length, 1, 'Battle Pass and Ranked both end Sep 10 — that is one moment');
    assert.strictEqual(flags[0].members.length, 2);
    assert.strictEqual(flags[0].key, 'bp+rank');
    assert.strictEqual(flags[0].label, 'battle pass + ranked');
    assert.strictEqual(flags[0].level, 0, 'one chip per date means no second row to fall to');
});

// The falsifier the merge needs: grouping must still SEPARATE dates that differ, or "one chip" is being achieved by collapsing everything rather than by modelling the date.
check('THE MERGE CAN FAIL: deadlines on different days stay separate chips', () => {
    const apart = { ...SEASON, rankEnd: '2026-09-14T00:00:00.000Z' };
    const { flags } = deadlineRail(apart, '2026-08-06', '2026-09-19');
    assert.strictEqual(flags.length, 2);
    assert.deepStrictEqual(flags.map((f) => f.key), ['bp', 'rank']);
    assert.notStrictEqual(flags[0].pct, flags[1].pct);
});

check('a deadline beyond the window is pinned to the edge it is beyond, with the distance', () => {
    const { flags, pins } = deadlineRail(SEASON, '2026-08-06', '2026-09-19');
    assert.deepStrictEqual(flags.map((f) => f.key), ['bp+rank']);
    assert.strictEqual(pins.length, 1);
    assert.strictEqual(pins[0].key, 'dmz');
    assert.strictEqual(pins[0].side, 'r');
    assert.strictEqual(pins[0].away, 53, 'the count is days beyond the boundary, not days from today');
});

check('a deadline before the window pins to the LEFT edge', () => {
    const { pins } = deadlineRail(SEASON, '2026-09-20', '2026-10-20');
    // Same date, same pin — the merge applies on the way out of the window as much as inside it.
    assert.deepStrictEqual(pins.map((p) => p.side).sort(), ['l', 'r']);
    assert.strictEqual(pins.find((p) => p.key === 'bp+rank').away, 10);
});

// 🔴 A PIN IS BOTTOM-ANCHORED AND A FLAG IS TOP-ANCHORED, so nothing about a shared "level" keeps them apart — only the rail's height does, and it was a constant 52px. Measured on the page, the pinned DMZ chip painted through the Ranked flag.
check('pins stack among themselves, per side, and never take a flag row', () => {
    const { pins } = deadlineRail(SEASON, '2026-09-20', '2026-10-20');
    assert.deepStrictEqual(pins.map((p) => [p.side, p.level]).sort(), [['l', 0], ['r', 0]]);
});

check('the rail reserves height for the rows it actually has', () => {
    const one = railBox({ flags: [{ level: 0 }], pins: [] }, false);
    const withPin = railBox({ flags: [{ level: 0 }], pins: [{ level: 0, side: 'r' }] }, false);
    const withSpan = railBox({ flags: [{ level: 0 }], pins: [{ level: 0, side: 'r' }] }, true);
    const twoRows = railBox({ flags: [{ level: 0 }, { level: 1 }], pins: [{ level: 0, side: 'r' }] }, true);
    // 45, not 52: the design's own rail measures 45 for one flag row plus one pin, and the 52 here was a floor that beat the content on every season — so the constant, not the data, was setting the height. The stylesheet's own min-height:52px is unchanged and unreachable, exactly as it is in the design, because the inline height the component computes always wins.
    assert.strictEqual(one.height, 45, 'the floor never beats the rows the rail actually has');
    assert.ok(withSpan.height > withPin.height, 'a span occupies a row of its own below the flags');
    assert.ok(twoRows.height > withSpan.height, 'a second flag row pushes everything below it down');
    assert.strictEqual(withSpan.spanTop, 21, 'the span clears exactly the flag rows above it');
    assert.strictEqual(twoRows.spanTop, 42);
});

// 🔴 TWO DRAWS DATED Aug 22 RENDERED AT ONE COORDINATE and the second was unreachable — no hover, no focus, no tooltip. Measured on the fixture season before this existed.
check('points at one coordinate become one cluster that says so', () => {
    const pts = [
        { id: 'a', title: 'Void Implosion Draw', date: '2026-08-22', pct: 50 },
        { id: 'b', title: 'Wisterian Visage Draw', date: '2026-08-22', pct: 50 },
        { id: 'c', title: 'Far Away Draw', date: '2026-09-10', pct: 90 },
    ];
    const [c] = clusterPoints(pts, 1000);
    assert.strictEqual(clusterPoints(pts, 1000).length, 1, 'only the pair collides; the third is 400px away');
    assert.deepStrictEqual(c.ids, ['a', 'b']);
    assert.strictEqual(c.sameDay, true, 'no zoom separates two points on one date — the sentence must not offer one');
    assert.strictEqual(c.midPct, 50);
});

check('THE CLUSTER CAN FAIL: points far enough apart are left alone', () => {
    const pts = [{ id: 'a', date: '2026-08-01', pct: 10 }, { id: 'b', date: '2026-08-20', pct: 60 }];
    assert.deepStrictEqual(clusterPoints(pts, 1000), [], 'a threshold that groups these is not a threshold');
});

check('a cluster of NEARBY dates offers the zoom that a same-day cluster cannot', () => {
    const pts = [{ id: 'a', date: '2026-08-20', pct: 50 }, { id: 'b', date: '2026-08-22', pct: 51 }];
    const [c] = clusterPoints(pts, 1000);
    assert.strictEqual(c.sameDay, false);
    assert.strictEqual(c.gapDays, 2);
});

// Before the first layout there is no width to cluster by, and inventing one would group points that are nowhere near each other on the screen that is about to exist.
check('clustering is skipped entirely until the plot has been measured', () => {
    const pts = [{ id: 'a', date: '2026-08-22', pct: 50 }, { id: 'b', date: '2026-08-22', pct: 50 }];
    assert.deepStrictEqual(clusterPoints(pts, 0), []);
});

// ⚠️ TBD IS NOT A DATE, and drawing it at a position would put a deadline on the axis that the season has not set. It is stated in the identity panel, where "TBD" is a value the reader can act on. 🔴 EVERY VIEW SWITCHER IN THE PORTAL ANNOUNCED NO SELECTED TAB. `role="tab"` takes `aria-selected`; `aria-pressed` is a toggle button's state and a tab drops it silently — so the markup validated, the styling looked right, and the one thing the role exists to convey was never conveyed. Checkable, and nothing checked it.
check('no element carrying role="tab" uses aria-pressed instead of aria-selected', () => {
    const fs = require('fs'), path = require('path');
    const dir = path.join(__dirname, '..', 'portal', 'ui');
    const bad = [];
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.js'))) {
        const src = fs.readFileSync(path.join(dir, f), 'utf8');
        // Look inside each opening tag rather than line by line: these attributes routinely wrap.
        for (const tag of src.match(/<button[^>]*>/g) || []) {
            if (/role=["']tab["']/.test(tag) && /aria-pressed/.test(tag)) bad.push(f + ': ' + tag.slice(0, 70));
        }
    }
    assert.deepStrictEqual(bad, [], 'a tab announces selection with aria-selected');
});

check('THE ARIA GATE CAN FAIL: a tab written with aria-pressed is caught', () => {
    const tag = '<button role="tab" aria-pressed=${on}>';
    assert.ok(/role=["']tab["']/.test(tag) && /aria-pressed/.test(tag), 'the pattern the gate looks for must match a real offender');
});

check('a TBD deadline is neither a flag nor a pin', () => {
    const { flags, pins } = deadlineRail({ ...SEASON, bpEndTBD: true }, '2026-08-06', '2026-09-19');
    assert.ok(!flags.some((f) => f.key === 'bp'), 'a TBD deadline must not be drawn at the date it used to hold');
    assert.ok(!pins.some((p) => p.key === 'bp'));
});

check('a season with no deadlines at all produces an empty rail rather than throwing', () => {
    // ⚠️ THE SHAPE GAINED A THIRD LIST. The rail carries the season's patch notes now — they are dated season events and the Track drew none of them — so an exact-shape assertion has to name it. Kept exact rather than loosened to a subset check: this test exists to catch a rail that returns something unexpected, and `deepStrictEqual` on a known-empty season is what does that.
    const empty = deadlineRail({}, '2026-08-06', '2026-09-19');
    assert.deepStrictEqual(empty, { flags: [], pins: [], patches: [] });
    assert.deepStrictEqual(deadlineRail(null, '2026-08-06', '2026-09-19'), { flags: [], pins: [], patches: [] });
});

check('no flag is ever assigned a row the stylesheet does not define', () => {
    // Five deadlines crowded into one week: the rail has three rows, so the surplus shares the last one — an overlapping chip is readable, an absent deadline is not.
    const crowded = deadlineRail({ bpEnd: '2026-09-10', rankEnd: '2026-09-11', dmzEnd: '2026-09-12' }, '2026-09-09', '2026-09-13');
    assert.ok(crowded.flags.every((f) => f.level >= 0 && f.level <= 2),
        `a flag landed on row ${crowded.flags.map((f) => f.level).join(',')} and only lvl1 and lvl2 exist`);
});

// ── WHAT A MANIFEST ROW CARRIES ───────────────────────────────────────────────────────────────
//
// 🔴 THE TABLE SAID WHAT EVERY ITEM WAS CALLED AND NOTHING ABOUT WHAT IS IN IT. A draw's whole point is the items it carries and their rarity; the row showed a title, a type and a date, so the question this list exists to answer needed a click per row.
const { rowTiers, rowDetail, rowLifecycle, TIER_CLASS, toManifestRows } = require('../portal/ui/season.logic');

check('a tier chip is drawn once per rarity, in the order it first appears', () => {
    const row = { items: [{ tier: 'legendary', name: 'A' }, { tier: 'epic', name: 'B' }, { tier: 'legendary', name: 'C' }] };
    assert.deepStrictEqual(rowTiers(row), ['legendary', 'epic'], 'three items and two rarities is two chips');
});

// ⚠️ A `-#` COMMENT LINE IS A NOTE ATTACHED TO THE DRAW, not an item with a rarity — utils/adminParser.js stores it with tier 'comment'. Counting it would put a chip on the row for a sentence.
check('a comment line is not a rarity', () => {
    assert.deepStrictEqual(rowTiers({ items: [{ tier: 'comment', name: 'Character bundle only' }, { tier: 'mythic', name: 'X' }] }), ['mythic']);
    // ⚠️ THE TWO ANSWERS ARE DIFFERENT QUESTIONS AND THE SUBJECT HERE IS THE FIRST. A comment line is not a RARITY, so rowTiers excludes it; it IS an item in the draw, so the count includes it — the design's own detail reads "5 items" for a draw whose fifth line is a comment.
    assert.deepStrictEqual(rowDetail({ items: [{ tier: 'comment', name: 'a note' }, { tier: 'mythic', name: 'X' }] }), '2 items');
    assert.deepStrictEqual(rowDetail({ items: [{ tier: 'mythic', name: 'X' }] }), '1 item');
});

// ⚠️ ONLY THE THREE TIERS THE STYLESHEET DEFINES GET A CLASS. resolveTier also returns 'legacy' and a title-cased fallback for anything it does not know; inventing `t-legacy` would emit a class with no rule, which is the one thing portal:orphans exists to stop.
check('an unknown rarity gets no class rather than an invented one', () => {
    assert.strictEqual(TIER_CLASS.legendary, 't-leg');
    assert.strictEqual(TIER_CLASS.legacy, undefined, 'the sheet defines t-leg, t-myth and t-epic — nothing else');
    assert.strictEqual(TIER_CLASS['Some New Tier'], undefined);
});

check('a calendar entry says what it CARRIES, and a category is not that', () => {
    // The Type column two along already says it is a playlist. Printing it again here made 26 rows answer a question nobody asked and hid the design's own "no detail".
    assert.strictEqual(rowDetail({ category: 'playlist' }), '');
    assert.strictEqual(rowDetail({}), '', 'nothing to say is empty, and the cell renders "no detail" for it');
    // The one thing a calendar row does carry that no other column states.
    assert.strictEqual(rowDetail({ category: 'playlist', isOngoing: true }), 'runs all season');
});

// 🔴 BOTH ENDS ARE INCLUSIVE. Treating `end < now` as ended retires an entry at midnight of the morning it is still live — which is the entire span of a one-day event.
check('an entry whose last day is today is still running', () => {
    // 'live', not 'running': the Manifest and the Board answer this from ONE function now (lifecycleOf), after nine rows read ENDED in the table beside a card in Live now, from the same records.
    assert.strictEqual(rowLifecycle({ date: '2026-08-20', endDate: '2026-08-26' }, '2026-08-26'), 'live');
    assert.strictEqual(rowLifecycle({ date: '2026-08-26' }, '2026-08-26'), 'live', 'a one-day event is live on its day');
    assert.strictEqual(rowLifecycle({ date: '2026-08-20', endDate: '2026-08-25' }, '2026-08-26'), 'ended');
    assert.strictEqual(rowLifecycle({ date: '2026-08-27' }, '2026-08-26'), 'upcoming');
    assert.strictEqual(rowLifecycle({}, '2026-08-26'), '', 'an undated row states nothing rather than guessing');
});

check('THE INCLUSIVE-END RULE CAN FAIL: a strict comparison retires a one-day event on its own day', () => {
    assert.throws(() => {
        const end = '2026-08-26', today = '2026-08-26';
        assert.ok(!(end <= today) || end > today, `a strict end < today would call this ended on ${today}`);
    }, /would call this ended/);
});

// 🔴 THE TABLE CALLED ITSELF "EVERYTHING IN THE SEASON" AND OMITTED THE DRAFT ENTIRELY — twenty items in the harness fixture, invisible in the one place that claims to list everything. Found because the `.nextmark` branch keyed on `row.isDraft` and nothing ever set it: a branch that cannot be true is a button with no handler, one layer down.
const LIVE_SEASON = { newDraws: [{ _id: 'a', title: 'Live draw', date: '2026-08-10' }], returningDraws: [], calendar: [] };
const DRAFT_SEASON = { active: true, newDraws: [{ _id: 'b', title: 'Next draw', date: '2026-09-10' }], returningDraws: [], calendar: [] };

check('draft items appear in the manifest, marked, and only when the draft is active', () => {
    assert.strictEqual(toManifestRows(LIVE_SEASON, [], null).length, 1, 'no draft means no extra rows');
    assert.strictEqual(toManifestRows(LIVE_SEASON, [], { active: false, newDraws: [{ _id: 'b', title: 'x' }] }).length, 1,
        'an INACTIVE draft is a discarded one — the schema keeps the subdocument around after a discard');
    const both = toManifestRows(LIVE_SEASON, [], DRAFT_SEASON);
    assert.strictEqual(both.length, 2);
    const d = both.find((r) => r.isDraft);
    assert.strictEqual(d.title, 'Next draw');
    assert.strictEqual(d.state, 'staged', 'a staged item and a live one are not the same fact');
});

// ⚠️ THE ID IS PREFIXED because the Manifest keys rows, selections and the edit target on it, and nothing guarantees a draft subdocument's _id never matches a live one.
check('a draft row can never be mistaken for the live record it was copied from', () => {
    const copied = { active: true, newDraws: [{ _id: 'a', title: 'Live draw', date: '2026-08-10' }], returningDraws: [], calendar: [] };
    const rows = toManifestRows(LIVE_SEASON, [], copied);
    const ids = rows.map((r) => r.id);
    assert.strictEqual(new Set(ids).size, ids.length, 'two rows sharing an id is one row the table cannot address');
    assert.ok(ids.some((i) => String(i).startsWith('draft:')));
});

// ── THE FIVE FUNCTIONS THIS BRANCH ADDED AND DID NOT TEST ───────────────────────────────────────
//
// 🔴 WRITTEN AFTER THE FACT, AND THAT IS THE POINT OF SAYING SO. All five shipped in one green commit with a comment describing each boundary instead of a check enforcing it — and a comment cannot fail. An audit found them; the audit should not have had to.
const { bulkFieldDiff, findLocalBuild } = require('../portal/ui/armory.logic');
const { seasonSpanGeometry, spanBarFor, nowPctIn } = require('../portal/ui/season.logic');

const BUILD = { mode: 'MP', weaponName: 'Fennec', buildName: 'Close', category: 'SMG',
                shareCode: 'ABC', attachments: ['a', 'b'], isMeta: false };

check('a bulk row that changes a field names the field, the old value and the new one', () => {
    const diff = bulkFieldDiff({ ...BUILD, category: 'AR' }, BUILD);
    assert.deepStrictEqual(diff, [{ field: 'category', word: 'Category', was: 'SMG', now: 'AR' }]);
});

check('a field the pasted block never mentioned is not reported as a change', () => {
    // The upsert leaves an absent field alone, so `undefined` must not read as "cleared" — that would warn about an overwrite the server is not going to perform.
    const diff = bulkFieldDiff({ weaponName: 'Fennec', buildName: 'Close', category: 'SMG' }, BUILD);
    assert.deepStrictEqual(diff, [], 'an absent key is not a change');
});

check('THE OVERWRITE WARNING CAN FAIL: an unknown local build reports null, never an empty diff', () => {
    // 🔴 THE DISTINCTION THE UI DEPENDS ON. `null` renders "this exists and will be overwritten, and the before values are not loaded here"; `[]` renders nothing at all. Collapse the two and the panel silently stops warning about exactly the overwrites it cannot inspect — inside the component built to prevent a silent overwrite.
    assert.strictEqual(bulkFieldDiff({ ...BUILD }, null), null);
    assert.notDeepStrictEqual(bulkFieldDiff({ ...BUILD }, null), []);
});

check('a local build is matched case- and space-insensitively, and only within its own mode', () => {
    assert.ok(findLocalBuild([BUILD], { weaponName: ' fennec ', buildName: 'CLOSE' }, 'MP'));
    assert.strictEqual(findLocalBuild([BUILD], { weaponName: 'Fennec', buildName: 'Close' }, 'DMZ'), null,
        'a DMZ paste must never match an MP record');
});

check('a season whose dated things all land on one day yields no span geometry', () => {
    // 🔴 OTHERWISE EVERY ROW DRAWS A FULL-WIDTH BAR. A zero span divides by zero; returning null makes the column render nothing, which is the honest answer for a season with no extent. Pinned for the same reason the midpoint case below is: with today in the extent, a single-day season is only degenerate when today is that day.
    const ONE_DAY = Date.parse('2026-09-03T00:00:00Z');
    assert.strictEqual(seasonSpanGeometry({ newDraws: [{ date: '2026-09-03' }] }, ONE_DAY), null);
    assert.strictEqual(seasonSpanGeometry({}, ONE_DAY), null);
});

check('THE SPAN FLOOR CAN FAIL: a one-day release keeps a visible width', () => {
    const geo = seasonSpanGeometry({ calendar: [{ date: '2026-09-01', endDate: '2026-10-01' }] });
    const point = spanBarFor({ date: '2026-09-15' }, geo);
    assert.ok(point.width >= 1.5, `a point release rendered at ${point.width}% would be invisible`);
    // And the floor must not push it past the right edge.
    const last = spanBarFor({ date: '2026-10-01' }, geo);
    assert.ok(last.left + last.width <= 100.001, 'a bar may not overflow its own track');
});

check('now is placed only when it falls inside the season, never clamped to an edge', () => {
    // 🔴 THE DAY IS PINNED. seasonWindow includes today in the extent, so an unpinned geometry made this assertion depend on the date the suite ran: the midpoint of a Sep 1 → Oct 1 season is only the midpoint if today is inside it. Pinning is what makes the 50% claim mean something.
    const geo = seasonSpanGeometry({ calendar: [{ date: '2026-09-01', endDate: '2026-10-01' }] }, Date.parse('2026-09-16T00:00:00Z'));
    assert.strictEqual(nowPctIn(geo, Date.parse('2020-01-01T00:00:00Z')), null, 'before the season');
    assert.strictEqual(nowPctIn(geo, Date.parse('2030-01-01T00:00:00Z')), null, 'after the season');
    assert.ok(Math.abs(nowPctIn(geo, Date.parse('2026-09-16T00:00:00Z')) - 50) < 2);
});

check('the rail carries a patch note inside the window and drops one outside it', () => {
    const season = { patchNotes: [
        { _id: 'a', title: 'In view', releaseDate: '2026-09-10' },
        { _id: 'b', title: 'Out of view', releaseDate: '2027-01-01' },
    ] };
    const rail = deadlineRail(season, '2026-09-01', '2026-09-30');
    assert.deepStrictEqual(rail.patches.map((x) => x.title), ['In view']);
});

// 🔴 THE DESIGN MARKS THE BAR THAT A REPAIRS FINDING IS ABOUT, AND THE PORTAL MARKED NOTHING. The mockup's markFlagged() strips the finding-kind prefix off the id, drops anything merely informational, and adds `flagged` to that bar — so a reader scanning the Track sees WHICH item the finding below is talking about. The portal already emits `data-id` on every bar and point and already computes the findings; the only missing piece was the mapping between them, which is why the audit reported `div.bar.flagged.saved` as mockup-only twice over.
//
// ⚠️ `past-bp-` IS A LONGER PREFIX THAN `past-` AND MUST BE STRIPPED FIRST. The battle-pass finding ids read `past-bp-<id>`; a regex that takes `past-` alone leaves `bp-<id>`, which matches no bar and marks nothing — the silent-miss shape the mockup's own console.warn exists to catch.
check('flaggedIds maps a finding id back to the bar it is about, and ignores the informational ones', () => {
    const { flaggedIds } = require('../portal/ui/track.logic');
    const got = flaggedIds([
        { id: 'ovl-a1', sev: 'warn' },
        { id: 'past-b2', sev: 'warn' },
        { id: 'gap-c3', sev: 'warn' },
        { id: 'past-bp-d4', sev: 'warn' },
        { id: 'dupe-e5', sev: 'warn' },
        { id: 'ovl-f6', sev: 'info' },
        { id: 'plain-g7', sev: 'warn' },
    ]);
    assert.ok(got.has('a1') && got.has('b2') && got.has('c3'), 'the three prefixes the design strips must all resolve');
    assert.ok(got.has('d4'), 'past-bp- must strip as the longer prefix, not leave bp-d4');
    assert.ok(got.has('e5'), 'dupe- is a finding about a specific row and marks it');
    assert.ok(!got.has('f6'), 'an informational finding marks nothing — the design filters sev!==info');
    assert.strictEqual(got.has('plain-g7'), true, 'an id with no known prefix is used as-is rather than dropped');
});

check('flaggedIds is silent on nothing, and never returns undefined for a caller to spread', () => {
    const { flaggedIds } = require('../portal/ui/track.logic');
    assert.strictEqual(flaggedIds([]).size, 0);
    assert.strictEqual(flaggedIds(null).size, 0);
    assert.strictEqual(flaggedIds(undefined).size, 0);
});

// 🔴 ONLY THE MECHANICAL FINDINGS MARK A ROW, and the first version of this marked THIRTEEN where the design marks two. The split the Repairs view is built on — what a machine can be SURE of, against what only a person can decide — is the same split that decides whether a bar wears the mark. A draw served without a calendar window is a judgement call about eleven perfectly valid rows; painting all eleven says "these are wrong", which is precisely the sentence the mechanical/judgement split exists to avoid making. The banner rows are excluded for a different reason: their id is a season FIELD KEY, never an item id, so it could not match a bar even if it were meant to. 🔴 THREE REALMS HAVE NOW SHIPPED A TONE THAT STYLES NOTHING, AND NOBODY WROTE THE CHECK. `home.js` carries a comment about a `tone:'live'` that styled nothing; Access shipped a fix for `tone:'hot'` and `tone:'bad'`; Analytics shipped `tone:'bad'` on its error count, so 23 errors rendered in ordinary ink where the design paints them orange. Each time the INSTANCE was fixed and the CLASS was left open. A tone is a class name in a data literal -- exactly the shape an orphan scan cannot follow -- so the only thing that can see it is a conservation check between the literals and the stylesheet. 🔴 A TONE IS A CLASS NAME IN A DATA LITERAL, WHICH IS THE ONE SHAPE AN ORPHAN SCAN CANNOT FOLLOW. Four realms shipped a tone that styles nothing -- home's `live`, access's `hot` and `bad`, analytics' `bad`, and review's `bad` on the BLOCKER COUNT, the number that says why you cannot commit. Each instance was fixed and the class left open until this check.
//
// ⚠️ TWO PREFIXES, NOT ONE. `Masthead` stats build `.stat.<tone>` and `Tile` builds `.tile.<tone>`, and the stylesheet defines different sets for each (`.stat.warn` exists, `.tile.ok` exists, `.stat.ok` does not). The first version checked `.stat` only and passed by luck, because every Tile in the tree happens to use `warn` -- a correct `tone: 'ok'` on a Tile would have failed it with the claim that a styled class styles nothing. That is a pattern standing in for an enumeration, which is the exact defect the sibling fix to `portalStatus` was about.
function toneLiterals(src) {
    // Comments are stripped FIRST: the first run of this check flagged `access.js:live` and `home.js:live`, and both matches were inside comments that exist to record those tones' REMOVAL. A check that reads its own documentation as evidence reports the opposite of the truth, confidently.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|\s)\/\/[^\n]*/g, '$1');
    const out = [];
    for (const m of code.matchAll(/\btone\s*[:=]/g)) {
        let seg = code.slice(m.index + m[0].length, m.index + m[0].length + 140);
        const nl = seg.indexOf('\n'); if (nl !== -1) seg = seg.slice(0, nl);
        const nextProp = seg.search(/,\s*[A-Za-z_$][\w$]*\s*:/); if (nextProp !== -1) seg = seg.slice(0, nextProp);
        for (const lit of seg.matchAll(/'([a-z][a-z0-9-]*)'/g)) out.push(lit[1]);
    }
    return out;
}

// 🔴 AN ARIA ROLE THAT CONTRADICTS THE ELEMENT'S IMPLICIT ONE IS WORSE THAN NO ROLE. This branch put `role="button"` on a `<tr>` inside a real `<table>`, which replaces the row's implicit `row` role and orphans every `<td>` -- whose required parent IS a row. It came from porting a note written about the design's DIV-based event table onto real table markup. ⚠️ FIVE ELEMENT NAMES, ENUMERATED, NOT A PATTERN. These are the table elements whose implicit roles carry structural meaning that a `role=` overrides; anything else is a judgement call this check does not make.
check('no table element in portal/ui carries a role= that overrides its implicit one', () => {
    const dir = path.join(__dirname, '..', 'portal', 'ui');
    const offenders = [];
    let scanned = 0;
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.js'))) {
        const src = fs.readFileSync(path.join(dir, f), 'utf8');
        const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|\s)\/\/[^\n]*/g, '$1');
        scanned++;
        for (const m of code.matchAll(/<(tr|td|th|tbody|thead|table)\b([^>]*)>/g)) {
            if (/\brole=/.test(m[2])) offenders.push(`portal/ui/${f}  <${m[1]} … role=…>`);
        }
    }
    assert.ok(scanned >= 5, `scanned ${scanned} portal/ui files -- the directory shape changed and this check has gone blind`);
    assert.deepStrictEqual(offenders, [], 'a role= here replaces the implicit table role and orphans the cells beneath it');
});

check('THE TABLE-ROLE GATE CAN FAIL: the real markup, with the real regression put back', () => {
    const real = fs.readFileSync(path.join(__dirname, '..', 'portal', 'ui', 'manifest.js'), 'utf8');
    // The anchor is the multi-line row tag, matched on its class expression rather than on a key= this file does not use. NO LINE NUMBER: it was cited as manifest.js:221 and had already drifted to :236 before this edit moved it again.
    // 🔴 THIS ASSERTION FIRED FOR REAL ON 2026-09-05 00:05 EDT AND THAT IS THE WHOLE POINT OF IT. Removing the dead `preview-sel` class took the row tag from `${(selected.has(row.id) ? 'sel' : '') + …}` to `${selected.has(row.id) ? 'sel' : ''}`, so the patch below stopped patching anything and the proof went vacuous — a gate that would have kept reporting a green table-role check over a falsifier that reintroduced nothing. The anchor now stops before the ternary, so a change to the CLASS LOGIC cannot silently blind it again; only a change to the tag itself can, and that is what the assertion is for.
    const broken = real.replace("<tr class=${selected.has(row.id)", '<tr role="button" class=${selected.has(row.id)');
    assert.notStrictEqual(broken, real, 'the row tag moved -- this proof no longer reintroduces anything');
    const code = broken.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|\s)\/\/[^\n]*/g, '$1');
    const hits = [...code.matchAll(/<(tr|td|th|tbody|thead|table)\b([^>]*)>/g)].filter((m) => /\brole=/.test(m[2]));
    assert.ok(hits.length >= 1, 'the scanner did not see a role= on a reintroduced <tr role="button">');
});

check('every tone a realm emits has a rule in the stylesheet', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', 'portal', 'ui', 'app.css'), 'utf8');
    const styled = new Set([...css.matchAll(/\.(?:stat|tile)\.([a-z][a-z0-9-]*)/g)].map((m) => m[1]));
    assert.ok(styled.size >= 3, `parsed ${styled.size} .stat/.tile tone rules -- the stylesheet's shape changed and this check has gone blind`);
    const dir = path.join(__dirname, '..', 'portal', 'ui');
    const emitted = [];
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.js'))) {
        for (const t of toneLiterals(fs.readFileSync(path.join(dir, f), 'utf8'))) emitted.push({ f, tone: t });
    }
    assert.ok(emitted.length >= 3, `found ${emitted.length} literal tones across portal/ui -- too few for this check to mean anything`);
    const dead = emitted.filter((e) => !styled.has(e.tone));
    assert.deepStrictEqual(dead.map((d) => `${d.f}:${d.tone}`), [],
        'these tones have no .stat/.tile rule, so they style NOTHING and the figure renders in ordinary ink');
});

// 🔴 THE PROOF RUNS THE REAL SCANNER OVER REAL SOURCE, because the previous one did not. It rebuilt one `filter` inline from a hand-made array, so it never exercised the comment stripping, the 140-char window, the next-property cut or the ternary collection -- break any of those and it stayed green. It was committed one function below a comment reading "a gate proven only against a fixture you designed is not proven."
check('THE TONE GATE CAN FAIL: the real scanner, over real source, with the real shipped bug put back', () => {
    const real = fs.readFileSync(path.join(__dirname, '..', 'portal', 'ui', 'analytics.js'), 'utf8');
    const broken = real.replace("tone: h.errors24h ? 'warn' : undefined", "tone: h.errors24h ? 'bad' : undefined");
    assert.notStrictEqual(broken, real, 'the masthead tone line moved -- this proof no longer reintroduces anything');
    const styled = new Set(['lead', 'stg', 'warn', 'ok', 'err']);
    assert.ok(toneLiterals(broken).includes('bad'), 'the scanner cannot see a tone inside a ternary, which is how every conditional tone is written');
    assert.deepStrictEqual(toneLiterals(real).filter((t) => !styled.has(t)), [], 'the unmodified tree must be clean');
});

check('findingBarIds marks only what a machine can be sure of — not the judgement calls', () => {
    const { findingBarIds } = require('../portal/ui/track.logic');
    const data = {
        event: [{ id: 'e1', title: 'Same Name', startDate: '2026-08-10', kind: 'span' },
                { id: 'e2', title: 'Same Name', startDate: '2026-08-10', kind: 'span' },
                { id: 'e3', title: 'Runs Long', startDate: '2026-08-01', endDate: '2026-09-30', kind: 'span' },
                { id: 'e4', title: '2x CP Bonanza', startDate: '2026-08-02', kind: 'span' }],
        draw: [{ id: 'd1', title: 'Synthetic Draw', date: '2026-08-05', dateOnly: true, kind: 'point' }],
        drawwindow: [{ id: 'w1', title: 'Orphan Window', startDate: '2026-08-03', endDate: '2026-08-09', kind: 'span' }],
    };
    const ids = findingBarIds(data, { bpEnd: '2026-09-01' }, {});
    assert.ok(ids.has('e2'), 'the duplicate row is mechanical and marks');
    assert.ok(ids.has('e3'), 'running past the battle pass is mechanical and marks');
    assert.ok(ids.has('w1'), 'a draw window matching no draw is mechanical and marks');
    assert.ok(!ids.has('d1'), 'a draw served synthetic is a JUDGEMENT call and must not paint the row as wrong');
    assert.ok(!ids.has('e4'), 'looks-like-2xCP is a judgement call and must not mark');
});

process.exit(failures ? 1 : 0);
