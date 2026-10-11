// portal/ui/review.logic.js — CommonJS + classic script. The pure half of the Review realm.
//
// Same contract as track.logic.js and board.logic.js: a classic <script> before app.js makes these top-level declarations globals an ESM module reads without an import, and Node's require() reads the same file as CommonJS. buildPortal emits the script tag for every *.logic.js automatically.

// A blocker is something standing between the staged work and the commit button. Each one names what to do about it — a gate that only says "no" teaches nothing.
//
// 🔴 THE NOUN AGREES WITH THE NUMBER, and it is not "gates open". The mockup shipped a masthead reading "1 GATES OPEN", warn-coloured, plural on a count of one, meaning the REVERSE of what it says: "gates open" reads as cleared, you may pass. On the screen where everything is written.
function blockersFor(ops, changesets, resolved, confirmText) {
    const out = [];
    const needExport = changesets.filter((c) => c.tier === 3 && !c.exportedAt);
    if (needExport.length) {
        out.push({ kind: 'export', n: needExport.length,
            msg: `${needExport.length} tier-3 change${needExport.length > 1 ? 's need' : ' needs'} an export before it will commit` });
    }
    const stale = ops.filter((o) => o.stale && !resolved[o.id]);
    if (stale.length) {
        out.push({ kind: 'stale', n: stale.length,
            msg: `${stale.length} change${stale.length > 1 ? 's were' : ' was'} staged against a record that has since moved` });
    }
    const blocked = ops.filter((o) => o.blocked);
    if (blocked.length) {
        out.push({ kind: 'invalid', n: blocked.length,
            msg: `${blocked.length} change${blocked.length > 1 ? 's no longer validate' : ' no longer validates'} against the current record` });
    }
    // 🔴 NEVER THE WORD "DELETE" — muscle memory carries you straight through that one. The word is the changeset's own id fragment, which the server independently expects, so typing it means you looked at the thing you are committing.
    for (const c of changesets.filter((c) => c.tier === 3)) {
        if ((confirmText[c.id] || '') !== c.confirmText) {
            out.push({ kind: 'type', n: 1, msg: `type “${c.confirmText}” to confirm the destructive change in ${c.realm}` });
        }
    }
    return out;
}

// Guarded exactly as track.logic.js is: a classic script in a real browser has no `module` global, and an unguarded assignment throws ReferenceError mid-parse.
if (typeof module !== 'undefined' && module.exports) module.exports = { blockersFor };
