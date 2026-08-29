// portal/ui/board.logic.js — CommonJS, imports nothing. Pure functions <Board> renders from.
//
// 🔴 BOARD IS THE CONTENT BOARD AGAIN -- Live now / Upcoming / Staged / Ended -- AND THE CITATION THAT SAID OTHERWISE WAS THE RETIRED DESIGN. This file used to open: "Board is the CHANGESET PIPELINE (spec F3 / §8.2), not a third content view". §F3 exists and says exactly that, which is why it survived three readings. What nobody checked is whether it still GOVERNS:
//
//   2026-08-20  the spec re-jobs Board into the pipeline, and 03-three-surfaces.html draws it that way
//   2026-08-23  the interactive package's season.html draws CONTENT-STATE columns instead, and COMPANION
//               §5.2 argues them at length -- including a block quote on why `Staged` is a deliberate single
//               exception among them, which is not the writing of somebody who thinks the screen was re-jobbed
//   2026-08-27  Harkirat, in CLAUDE.md: "the old design is essentially retired at this point. the design is
//               the mockup"
//
// The stylesheet had been agreeing with the newer design the whole time and nobody read it: `.bcard.ended`, `.bmeta.soon` and `.bcard.staged` are rules that only mean something for content-state columns -- a pipeline has no "ended" and nothing is "soon". Three consumers with no producer, sitting in app.css, describing the screen this file refused to build.
//
// ⚠️ THE LESSON IS NOT "READ MORE CAREFULLY". A citation has two tests and only the first was ever run: does it EXIST, and is it CURRENT. Checking existence feels like verification and is worth almost nothing against a document that has been superseded -- so date every source, and prefer the later artifact unless something later still says otherwise.
//
// The changeset pipeline is not lost: Review owns it, and CLAUDE.md already calls Review "the only screen that commits, and the only place staged work from any realm becomes real". A fourth view of changesets by state is the very redundancy §F3 complained about, with the noun changed.
//
// 🔴 Task 5's Files note says these three .logic.js files "import nothing" -- so gateCommit's logic is inlined here rather than required from portal/api/policy.js (this file must also load as a plain classic <script> in the browser, where require() does not exist). This is a deliberate, tiny duplication of a 4-line pure function, not the drift utils/manageActions.js's header warns against -- scripts/portalApi.test.js and scripts/portalUi.test.js both assert the identical tier-3 behaviour, so the two copies disagreeing would fail a test immediately, not silently.
function gateCommit({ tier, exportedAt, confirmText, expectText }) {
    if (tier < 3) return { ok: true };
    if (!exportedAt) return { ok: false, reason: 'This change must be exported before it can commit.' };
    if (confirmText !== expectText) return { ok: false, reason: 'Typed confirmation does not match. Type the exact name shown to confirm.' };
    return { ok: true };
}

// Which Board column a changeset belongs in. 'blocked' is a REAL column stating why (spec §8.2), derived from the same gate the server enforces -- never a separate client-side guess that could disagree with what commit would actually do. 🔴 CONFIRMATION TEXT IS NEVER KNOWN IN ADVANCE, so columnFor cannot depend on it -- an earlier draft of this function called gateCommit with `changeset.confirmText`, a field that does not exist anywhere until the moment a human actually types it into the Commit control, which meant no tier-3 changeset could EVER reach Ready (confirmText was always undefined). The typed confirmation is entered at the moment of committing (see board.js's Commit control) and verified SERVER-SIDE at that moment -- this function only classifies the structural half: has it been exported yet.
function columnFor(changeset) {
    if (changeset.state === 'committed') return null; // left the board once committed
    if (changeset.state === 'discarded') return null;
    if (changeset.state === 'draft') return 'draft';
    // 🔴 A CHANGESET WHOSE OWN STATE IS 'blocked' LANDED IN READY. portal/api/changesets.js sets state:'blocked' when validateSet FAILS, and this function only ever tested the tier-3 export gate -- so a set that could not possibly commit rendered in the Ready column under the Commit button, and the Staged column was structurally unreachable (nothing returned it). Found reading this file for the review screen; no test covered either behaviour, which is why it survived. Both are now asserted in scripts/portalUi.test.js.
    if (changeset.state === 'blocked') return 'blocked';
    if (changeset.tier >= 3 && !changeset.exportedAt) return 'blocked';
    return 'staged';
}

// Why a changeset sits in Blocked -- the Board's card shows this, never just "blocked".
function blockedReason(changeset) {
    if (changeset.state === 'blocked') return 'One or more operations failed validation and cannot be applied.';
    if (changeset.tier >= 3 && !changeset.exportedAt) return gateCommit({ tier: changeset.tier, exportedAt: null }).reason;
    return null;
}

// 🔴 READY IS ALL-OR-NOTHING, and that is the mockup's stated semantic rather than an invention: 03-three-surfaces.html's Ready column reads "Commit 0 of 3" with one blocker present, and its own caption explains why -- "Committing applies the whole set in a single transaction: all of it lands, or none of it does." So while ANYTHING is blocked, nothing is ready, and the staged work stays visibly staged instead of sitting under a Commit button that would refuse.
function groupByColumn(changesets) {
    const cols = { draft: [], staged: [], blocked: [], ready: [] };
    for (const c of changesets) {
        const col = columnFor(c);
        if (col) cols[col].push(c);
    }
    if (cols.blocked.length === 0) { cols.ready = cols.staged; cols.staged = []; }
    return cols;
}

// An op described in WORDS. The Board's cards used to read "3 op(s)", which tells you the size of a change and nothing about what it is. 03/04's cards carry a real sentence per op, and 04's review screen is built on the same descriptions -- so this lives here, once, rather than in either.
const OP_VERB = { add: 'Add', post: 'Post', edit: 'Edit', delete: 'Delete', bulkDelete: 'Delete', bulkAdd: 'Add', bulkReplace: 'Replace', purge: 'Purge', startNew: 'Start', promoteDraft: 'Promote', restore: 'Restore', restoreSnapshot: 'Restore', restoreDraft: 'Restore', removeSeason: 'Remove', restoreSeason: 'Restore', editSeason: 'Edit' };
const OP_NOUN = { draw: 'draw', calendar: 'calendar item', loadout: 'build', patchnote: 'patch note', season: 'season', announcement: 'announcement' };

function describeOp(op) {
    if (!op || !op.type) return 'Unknown operation';
    const [entity, verb] = String(op.type).split('.');
    const noun = OP_NOUN[entity] || entity;
    const action = OP_VERB[verb] || verb;
    const ids = (op.payload && Array.isArray(op.payload.ids)) ? op.payload.ids.length : null;
    const name = (op.payload && (op.payload.title || op.payload.text || op.payload.weaponName)) || null;
    if (ids) return `${action} ${ids} ${noun}${ids === 1 ? '' : 's'}`;
    return name ? `${action} ${noun} “${String(name).slice(0, 40)}”` : `${action} ${noun}`;
}

// What undoing this would do. Every op in core/ops has an invert(), so a committed change is always reversible -- but nothing ever SHOWED that before committing, which is the one thing a Discord modal structurally cannot do and the reason the Board exists as a surface at all.
const INVERSE_OF = { add: 'remove', post: 'remove', bulkAdd: 'remove', delete: 'restore', bulkDelete: 'restore', purge: 'restore', edit: 'put back the previous values on', bulkReplace: 'restore the previous', promoteDraft: 'un-promote', startNew: 'restore the previous' };

function describeInverse(op) {
    if (!op || !op.type) return null;
    const [entity, verb] = String(op.type).split('.');
    const undo = INVERSE_OF[verb];
    if (!undo) return null;
    const noun = OP_NOUN[entity] || entity;
    const ids = (op.payload && Array.isArray(op.payload.ids)) ? op.payload.ids.length : null;
    return ids ? `Undo would ${undo} ${ids} ${noun}${ids === 1 ? '' : 's'}` : `Undo would ${undo} the ${noun}`;
}

// A field-level diff between an op preview's before/after, for the review screen's two panes. Only fields that actually CHANGED are returned: a diff listing thirty identical rows so the reader can hunt for the one that moved is a diff that has stopped doing its job.
const DIFF_SKIP = new Set(['_id', '__v', 'id', 'color', 'createdBy']);
function diffRows(before, after) {
    const a = (before && typeof before === 'object') ? before : {};
    const b = (after && typeof after === 'object') ? after : {};
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => !DIFF_SKIP.has(k));
    const rows = [];
    for (const key of keys.sort()) {
        // 🔴 COMPARE THE VALUES, DISPLAY THE FORMATTING — this used to compare the FORMATTED strings, and `fmtDiffValue` truncates at 60 characters, so any change beyond character 60 vanished from the diff entirely. Measured live 2026-08-28: a calendar banner URL is ~104 characters of Cloudinary path that differs only in its tail, so editing a banner produced an op with ZERO rows on the one screen that commits — a change the reader is asked to approve while being shown nothing at all about it. The same hole swallows an edit to the end of any long title or note.
        if (sameValue(a[key], b[key])) continue;
        const from = fmtDiffValue(a[key]);
        const to = fmtDiffValue(b[key]);
        rows.push({ key, from, to, kind: from === '—' ? 'add' : to === '—' ? 'del' : 'change' });
    }
    return rows;
}

// Equality on the VALUE, before any formatting shortens it. Dates compare by instant, arrays and records by content — the shapes previews actually return.
function sameValue(x, y) {
    if (x === y) return true;
    if (x instanceof Date || y instanceof Date) {
        const t = (v) => (v instanceof Date ? v.getTime() : new Date(v).getTime());
        return t(x) === t(y);
    }
    if (x && y && typeof x === 'object' && typeof y === 'object') {
        try { return JSON.stringify(x) === JSON.stringify(y); } catch { return false; }
    }
    const norm = (v) => (v === undefined || v === null ? '' : String(v));
    return norm(x) === norm(y);
}

function fmtDiffValue(v) {
    if (v === undefined || v === null || v === '') return '—';
    if (Array.isArray(v)) return v.length ? `${v.length} item${v.length === 1 ? '' : 's'}` : '—';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    // A nested record renders by its own NAME, not as 60 characters of raw JSON. draw.delete's preview returns before:{draw:{title,date,items,...}}, which stringified to `{"title":"Judgment Day - It Goes Two","date":"2026-08-07T00:` mid-key — a diff cell that makes the reader parse JSON to learn what is being deleted has stopped being a diff.
    if (typeof v === 'object') {
        const name = v.title || v.text || v.weaponName || v.name;
        if (name) return String(name).slice(0, 60);
        const keys = Object.keys(v);
        return keys.length ? `${keys.length} field${keys.length === 1 ? '' : 's'}` : '—';
    }
    const s = String(v);
    // A raw ISO datetime in a diff is unreadable next to its neighbour; a bare date is the unit every other date in this portal is shown in.
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
    // ⚠️ A LONG VALUE KEEPS ITS TAIL. A head-only truncation renders two different URLs as the same 60 characters, so the reader is shown a row whose two cells are identical — which reads as a rendering fault rather than as a change. The end is also where a URL, a filename and a version segment actually differ.
    return s.length > 60 ? s.slice(0, 32) + '…' + s.slice(-26) : s;
}

// Guarded: a classic <script> in a real browser has no `module` global, and an unguarded assignment throws ReferenceError mid-parse -- silently true here only because every function above already executed before this line ran. Found by actually loading this file in a browser rather than assuming the classic-script plan would just work.

// 🔴 THIS BLOCK MUST STAY ABOVE THE `typeof module` GUARD, and it was written INSIDE it once. Everything below that line runs only in Node, so `npm test` imported these functions and passed while the browser had none of them: the Board rendered as an empty panel and the page threw "groupBoardItems is not a function". The guard is two lines from where the insert landed and its own comment warns about this exact runtime split. A test suite that exercises the Node half of a dual-runtime file can be fully green about code the page cannot see.

// ── the CONTENT axis ──────────────────────────────────────────────────────────────────────────────────── Ported from season.html's own lifecycle(), NOT re-derived, because that function carries four fixes that each cost a real bug and would be re-earned by anybody starting from the dates alone:
//   1. A release is a MOMENT. A draw whose window has passed is history the day after it fires -- reading it as "started and not ended" labelled every past release LIVE NOW forever.
//   2. UNLESS it is dateOnly. A draw with no calendar window genuinely never ends; that is deliberate bot behaviour and 11 of the 14 real draws are like that, so it is the single most useful thing this screen says.
//   3. Patch notes are not calendar entries. isEventEnded never sees one, so applying it made a note from July read LIVE NOW permanently -- that alone put 23 of 39 items in one column. The newest note is current; the rest are history.
//   4. `end <= today` reported a draw ENDED the instant its UTC midnight passed, which for any US viewer is almost immediately. That exact bug shipped in the bot on 2026-08-07.
const LIFE_ORDER = ['live', 'upcoming', 'staged', 'ended'];

function hasEnded(item, todayIso) {
    // 🔴 A POINT NEVER "ENDS" HERE, and dropping this broke the port on its first test. The bot's own isEventEnded short-circuits `kind === 'point'` to false because it never sees one; a draw's endDate is a COPY of its release date, so testing `end < today` reported every past release as ended — including the dateOnly ones, which is the exact opposite of the rule this function exists to carry. Whether a past release is history is decided one level up, by whether it HAS a calendar window; it is never decided here. Caught by the assertion, not by reading.
    if (item.kind === 'point') return false;
    // isOngoing rows end when the season's own wall does, never on a date of their own.
    if (item.isOngoing) return false;
    const end = item.endDate || item.date;
    if (!end) return false;
    return String(end).slice(0, 10) < String(todayIso).slice(0, 10);
}

function lifecycleOf(item, ctx) {
    const today = String(ctx.today).slice(0, 10);
    const start = String(item.startDate || item.date || '').slice(0, 10);
    if (item.state === 'staged' || item.state === 'blocked') return 'staged';
    if (item.lane === 'patchNotes') {
        if (start > today) return 'upcoming';
        return ctx.newestPatchNoteId && ctx.newestPatchNoteId === item.id ? 'live' : 'ended';
    }
    if (item.kind === 'point' && !item.dateOnly && start < today) return 'ended';
    if (!hasEnded(item, today)) return start <= today ? 'live' : 'upcoming';
    return 'ended';
}

function groupBoardItems(items, ctx) {
    const g = { live: [], upcoming: [], staged: [], ended: [] };
    for (const it of items || []) g[lifecycleOf(it, ctx)].push(it);
    return g;
}

const dayDiff = (a, b) => Math.round(
    (new Date(String(b).slice(0, 10) + 'T00:00:00Z') - new Date(String(a).slice(0, 10) + 'T00:00:00Z')) / 86400000);

// 🔴 EVERY COLUMN'S SECOND LINE ANSWERS THE SAME QUESTION: what is at the EDGE of this column? An earlier version had Ended reading "10 archived", which is the count already in the pill beside it -- one column in four spending its only line of explanation repeating its neighbour. ⚠️ ONLY A SPAN ENDS. Reading `.end` across the whole column pulls in points, whose end IS their release, so "Live now" reported the release date of a patch note that does not end at all. The summary line states a DATE, and it has to state it the way every other date on this page is stated — the first version printed the raw ISO string, so one line in four read "next ends 2026-08-30" beside "Aug 27 → Sep 2" in the card directly below it.
const fmtShort = (iso) => (iso ? new Date(String(iso).slice(0, 10) + 'T00:00:00Z')
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '');

function boardColumnSummary(key, col, ctx) {
    if (!col.length) return '';
    const spans = col.filter((i) => i.kind !== 'point');
    const ends = spans.map((i) => String(i.endDate || '').slice(0, 10)).filter(Boolean).sort();
    const starts = col.map((i) => String(i.startDate || i.date || '').slice(0, 10)).filter(Boolean).sort();
    if (key === 'live') {
        if (ends.length) return 'next ends ' + fmtShort(ends[0]);
        const pts = col.filter((i) => i.kind === 'point').length;
        return pts ? pts + ' with no end date' : '';
    }
    if (key === 'upcoming') return starts.length ? 'next ' + fmtShort(starts[0]) : '';
    if (key === 'staged') return 'uncommitted';
    return ends.length ? 'last ended ' + fmtShort(ends[ends.length - 1]) : '';
}

const SOON_DAYS = 2;
function boardSoon(item, key, ctx) {
    if (key === 'staged' || key === 'ended') return false;
    const today = String(ctx.today).slice(0, 10);
    const d = item.kind === 'point' || key === 'upcoming'
        ? dayDiff(today, item.startDate || item.date)
        : dayDiff(today, item.endDate || item.date);
    return d >= 0 && d <= SOON_DAYS;
}

function boardMeta(item, key, ctx) {
    const today = String(ctx.today).slice(0, 10);
    if (key === 'staged') return 'not visible to players yet';
    if (item.kind === 'point') {
        const d = dayDiff(today, item.startDate || item.date);
        return d > 0 ? `releases in ${d}d` : d === 0 ? 'releases today' : `released ${-d}d ago`;
    }
    if (key === 'upcoming') return `starts in ${dayDiff(today, item.startDate)}d`;
    if (key === 'ended') return `ran ${dayDiff(item.startDate, item.endDate) + 1}d`;
    const left = dayDiff(today, item.endDate);
    return left >= 0 ? `${left}d left` : 'running';
}

const BOARD_EMPTY = {
    live: 'Nothing is running right now.',
    upcoming: 'Nothing is scheduled ahead of today.',
    staged: 'Nothing staged. Edits collect here until you commit them — the bot sees none of it yet.',
    ended: 'Nothing has ended yet this season.',
};

if (typeof module !== 'undefined' && module.exports) {
    
module.exports = { columnFor, blockedReason, groupByColumn, gateCommit, describeOp, describeInverse, diffRows, fmtDiffValue, lifecycleOf, groupBoardItems, boardColumnSummary, boardSoon, boardMeta, BOARD_EMPTY, LIFE_ORDER, hasEnded };
}
