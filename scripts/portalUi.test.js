// scripts/portalUi.test.js Render functions are PURE: state in, tree out. No DOM, no browser, no framework harness. That is the whole frontend testing story, and it only works because the components take state as an argument rather than reaching for it.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { bandClass, laneFor, tierOf, findOverlaps, findGaps, findDuplicateTitles } = require('../portal/ui/track.logic');   // CJS sibling — see the Files note
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

const { dateFromOffset, editOpFor } = require('../portal/ui/track.logic');

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
    const w = seasonWindow({ newDraws: [{ date: '2026-08-06' }], calendar: [{ date: '2026-08-01', endDate: '2026-09-13' }] }, Date.parse('2026-08-23'));
    assert.strictEqual(w.start, '2026-08-01');
    assert.strictEqual(w.end, '2026-09-13');
});

check('every Manifest lane resolves a REAL topic token, and Playlist is not Event', () => {
    // manifest.js reads row.topicVar and nothing ever set it — every row drew the --ink3 fallback.
    assert.strictEqual(topicVarFor('newDraws', {}), '--draw');
    assert.strictEqual(topicVarFor('returningDraws', {}), '--ret');
    assert.strictEqual(topicVarFor('calendar', { category: 'Event' }), '--ev');
    assert.strictEqual(topicVarFor('calendar', { category: 'Playlist' }), '--play');
    assert.strictEqual(typeLabelFor('calendar', { category: 'Playlist' }), 'Playlist');
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
            const m = line.match(/<\/code>\s*[.,;:!?]/);
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

check('two deadlines on the same day take different rows', () => {
    const { flags } = deadlineRail(SEASON, '2026-08-06', '2026-09-19');
    assert.strictEqual(flags.length, 2);
    assert.strictEqual(flags[0].pct, flags[1].pct, 'the same day is the same position — that is the whole reason they must stack');
    assert.notStrictEqual(flags[0].level, flags[1].level, 'two chips at one x on one row is one chip hiding another');
});

check('THE STACKING CAN FAIL: same-day flags sharing a row would hide one another', () => {
    assert.throws(() => {
        const flags = [{ pct: 79.5, level: 0 }, { pct: 79.5, level: 0 }];
        assert.notStrictEqual(flags[0].level, flags[1].level, 'two chips at one x on one row');
    }, /one x on one row/);
});

check('a deadline beyond the window is pinned to the edge it is beyond, with the distance', () => {
    const { flags, pins } = deadlineRail(SEASON, '2026-08-06', '2026-09-19');
    assert.deepStrictEqual(flags.map((f) => f.key), ['bp', 'rank']);
    assert.strictEqual(pins.length, 1);
    assert.strictEqual(pins[0].key, 'dmz');
    assert.strictEqual(pins[0].side, 'r');
    assert.strictEqual(pins[0].away, 53, 'the count is days beyond the boundary, not days from today');
});

check('a deadline before the window pins to the LEFT edge', () => {
    const { pins } = deadlineRail(SEASON, '2026-09-20', '2026-10-20');
    assert.deepStrictEqual(pins.map((p) => p.side).sort(), ['l', 'l', 'r']);
    assert.strictEqual(pins.find((p) => p.key === 'bp').away, 10);
});

// ⚠️ TBD IS NOT A DATE, and drawing it at a position would put a deadline on the axis that the season has not set. It is stated in the identity panel, where "TBD" is a value the reader can act on.
check('a TBD deadline is neither a flag nor a pin', () => {
    const { flags, pins } = deadlineRail({ ...SEASON, bpEndTBD: true }, '2026-08-06', '2026-09-19');
    assert.ok(!flags.some((f) => f.key === 'bp'), 'a TBD deadline must not be drawn at the date it used to hold');
    assert.ok(!pins.some((p) => p.key === 'bp'));
});

check('a season with no deadlines at all produces an empty rail rather than throwing', () => {
    const empty = deadlineRail({}, '2026-08-06', '2026-09-19');
    assert.deepStrictEqual(empty, { flags: [], pins: [] });
    assert.deepStrictEqual(deadlineRail(null, '2026-08-06', '2026-09-19'), { flags: [], pins: [] });
});

check('no flag is ever assigned a row the stylesheet does not define', () => {
    // Five deadlines crowded into one week: the rail has three rows, so the surplus shares the last one — an overlapping chip is readable, an absent deadline is not.
    const crowded = deadlineRail({ bpEnd: '2026-09-10', rankEnd: '2026-09-11', dmzEnd: '2026-09-12' }, '2026-09-09', '2026-09-13');
    assert.ok(crowded.flags.every((f) => f.level >= 0 && f.level <= 2),
        `a flag landed on row ${crowded.flags.map((f) => f.level).join(',')} and only lvl1 and lvl2 exist`);
});

process.exit(failures ? 1 : 0);
