// portal/ui/board.logic.js — CommonJS, imports nothing. Pure functions <Board> renders from.
//
// Board is the CHANGESET PIPELINE (spec F3 / §8.2), not a third content view -- its columns are pipeline stages (Draft -> Staged -> Blocked -> Ready), derived from a Changeset document's own state/tier/exportedAt, never assigned by hand.
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { columnFor, blockedReason, groupByColumn, gateCommit, describeOp, describeInverse, diffRows, fmtDiffValue };
}
