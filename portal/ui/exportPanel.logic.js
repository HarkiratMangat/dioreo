// portal/ui/exportPanel.logic.js — classic <script> in the browser, CommonJS in Node. See track.js's header for why every .logic.js sibling loads that way.
//
// 🔴 RETENTION IS SESSION-LIVED AND THE COPY SAYS SO, which is the difference between this and the mockup it comes from. The mockup's empty state reads "One-way operations stay locked until there is one" — in this portal that is FALSE: the one-way strip deliberately does not gate on a session export, because an export here is a property of a CHANGESET and the changeset does not exist until the op is staged. The real interlock sits at Review. Carrying that sentence across would have promised a safeguard this build does not have, which is worse than promising none.
//
// So what this list is FOR: a person who exported ten minutes ago and cannot remember whether they did. It answers that, and nothing more.
const EXPORTS = new Map();

function recordExport(id, meta) {
    EXPORTS.set(id, { at: Date.now(), rows: 0, bytes: 0, ...meta });
    return EXPORTS.get(id);
}

function exportRecords() {
    return [...EXPORTS.entries()]
        .map(([id, d]) => ({ id, ...d }))
        .sort((a, b) => b.at - a.at);
}

function exportRecord(id) { return EXPORTS.get(id) || null; }
function clearExports() { EXPORTS.clear(); }

// ⚠️ THE COUNT IS OF SCOPES TAKEN, NOT OF DOWNLOADS. Taking the same scope twice is one thing exported, and a strip reading "3 of 2 exported" is a strip nobody believes again. 🔴 "4 FORMATS" ANSWERS THE WRONG QUESTION. It says how many buttons are behind the control and nothing about what you would get -- and the one thing a person wants before taking a backup is how much of their season is in it. The mockup's own summary is `items.length + ' items · ' + formats`, and every scope here already carries a `count`, so the number was available and unused. Falls back to the format count alone when no scope declares one, since a made-up zero would be worse than the old line.
//
// ⚠️ ONCE ANYTHING HAS BEEN EXPORTED THIS SESSION, PROGRESS REPLACES THE INVENTORY. "2 of 4 exported this session" is the more useful fact at that moment -- it answers "what have I still not taken?" -- and it is a portal advance over the mockup rather than a divergence to correct.
function exportSummary(scopes) {
    const list = scopes || [];
    const total = list.length;
    if (!total) return '';
    const done = list.filter((s) => EXPORTS.has(s.id)).length;
    if (done) return `${done} of ${total} exported this session`;
    const items = list.reduce((n, s) => n + (Number(s.count) || 0), 0);
    const formats = `${total} format${total === 1 ? '' : 's'}`;
    return items ? `${items} item${items === 1 ? '' : 's'} · ${formats}` : formats;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { recordExport, exportRecords, exportRecord, clearExports, exportSummary };
}
