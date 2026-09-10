// scripts/lib/handoffCoverage.cjs — the two questions a handoff cannot answer about itself.
//
// 🔴 WHY THIS EXISTS. On 2026-09-10 a handoff summarised 36 pinned items into nine groups and shipped
// with one of them in NEITHER carrier, another in no worklist, and three counted twice. Every gate was
// green: the carriers were in order, the prose reflowed, docs:audit passed. **Nothing compared the
// summary against the list it summarised**, which is the same defect the session before it shipped —
// a confident table nobody checked against its source. Harkirat found it by asking whether the check
// was thoughtful or mechanical. It was mechanical.
//
// 🔴 AND THE SECOND FUNCTION IS THE UPSTREAM ONE. That handoff had no thinking pass run over it. A pass
// ran over the PLAN before it was written and none over the ARTIFACT afterwards, which is how all four
// defects survived. `docs-audit`'s `plan-audit-log` already solved exactly this for plans — a plan with
// no audit log is a plan nobody tried to break, and that is invisible afterwards. A handoff is the same
// object: written once, read by someone with none of the context that produced it.
//
// ⚠️ EMPTY IS HONEST, in both. "no gaps found" must stay writable or the check only teaches people to
// invent findings — the same carve-out plan-audit-log makes and for the same reason.

// `<!-- coverage: local/portal-sync-notes.md · · (pmt\w+) · -->`
// The source it summarises, and the pattern that pulls one id out of that source.
function coverageDirective(text) {
    const m = /<!--\s*coverage:\s*(\S+)\s*·\s*(.+?)\s*-->/.exec(text || '');
    return m ? { source: m[1], pattern: m[2] } : null;
}

// Returns { ids, missing, vacuous }. `carriers` are the texts a reader can actually reach.
//
// 🔴 `vacuous` IS THE LOAD-BEARING FIELD AND IT IS THE ONE I WOULD HAVE FORGOTTEN. A pattern that
// matches nothing yields zero ids and therefore zero missing — "everything is covered", reported as a
// pass, forever. A check that cannot fail is worse than no check because it manufactures confidence,
// so extracting zero ids from a source that exists is a FAILURE, never a success.
function coverageGaps(sourceText, pattern, carriers) {
    let re;
    try { re = new RegExp(pattern, 'g'); } catch { return { ids: [], missing: [], vacuous: true, badPattern: true }; }
    const ids = [...new Set([...String(sourceText).matchAll(re)].map((m) => m[1] ?? m[0]))];
    const joined = carriers.filter(Boolean).join('\n');
    return { ids, missing: ids.filter((id) => !joined.includes(id)), vacuous: ids.length === 0 };
}

// A handoff records the pass that tried to break it, the way a plan does.
//
// 🔴 THE FIRST VERSION ACCEPTED THREE PHRASES AND THEY WERE THE THREE I HAPPENED TO USE. Harkirat,
// 2026-09-10 13:25 EDT: *"a test of a new check against a narrow population is a checker optimized for an
// artificial scope."* Measured across all 109 handoffs in `local/handoff/`: the narrow predicate
// matched **1** — the one written to satisfy it — while **23** carry a genuine self-critical section
// under vocabulary they chose: "Important correction", "Two standing lessons", "Where the spec was
// WRONG or incomplete", "The two corrections", "The premise correction". Failing 22 sessions that DID
// the work, for using their own words, is a check that teaches people to rename headings.
//
// ⚠️ AND WIDENING HAS ITS OWN FAILURE: accept too much and it passes on anything. The line drawn here
// is that the heading must be ABOUT THE DOCUMENT OR THE WORK BEING WRONG — a correction, a mistake, a
// falsification, an audit — not merely reflective ("Notes", "Context", "Lessons for next time" is
// borderline and is admitted deliberately, because a session writing that heading did look back).
const PASS_HEADING = /^#{2,4}\s*[^\n]*\b(audit log|falsif|what the pass found|correction|corrections|got wrong|was wrong|where this is wrong|what i missed|standing lessons|mistakes?)\b/im;
function hasPassRecord(text) { return PASS_HEADING.test(text || ''); }

module.exports = { coverageDirective, coverageGaps, hasPassRecord };
