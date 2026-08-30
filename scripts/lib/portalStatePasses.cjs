// scripts/lib/portalStatePasses.cjs — what a collected state MEANS. The judgement half of the states harness, kept out of the browser so it can be falsified without one.
//
// 🔴 EVERY PASS HERE IS RELATIONAL, AND THAT IS THE WHOLE POINT. The gates this project already has are shaped `for each element: assert P(element)` — a stylesheet rule resolves, a class has a definition, a route has a handler. Not one of them can see TWO elements disagreeing, which is why the command bar shipped a 44px input inside a 34px wrapper for weeks with every check green, reported twice by a human and caught by no gate. A pass that compares a child against its parent, a tab order against an open dialog, or a box against the space it is given is the only kind that finds this class of defect.
//
// ⚠️ THEY SELECT BY ROLE IN THE COMPOSITE, NEVER BY THE FIX. The mockup's own version of PASS 1 first iterated `[data-bare]` — so removing the marker, which is exactly the regression it exists to catch, left it with nothing to iterate and it reported clean. Vacuous by construction. Here PASS 1 iterates every form control, and the marker is invisible to it.
//
// The browser collects raw records; these functions decide. Each returns findings shaped { pass, id, detail } so the driver can print, ratchet and diff them uniformly.

// PASS 1 · COMPOSITE — a control drawing its own box inside a wrapper that already draws one.
function pass1Composite(records) {
    const out = [];
    for (const r of records.controls || []) {
        if (!r.parentPaints) continue;
        if (r.parentH <= 0 || r.h <= 0) continue;                                        // a control inside a collapsed panel is not on screen; it is measured when its state is walked
        // 🔴 A FIELD INSIDE A PANEL IS NOT A DOUBLED BOX. `.nw-i` is a normal input with its own border sitting in a panel that also paints one, and the first version of this pass reported it on every state — a finding that is wrong three times a run is a finding nobody reads. The defect this pass exists for is a COMPOSITE: a wrapper drawn tight around the control, so the two boxes are visibly one thing drawn twice. Tightness is the test, and the overflow case below stands on its own regardless.
        const tight = r.parentH - r.h <= 12;
        if (tight && r.border > 0 && r.selfPaintsBg) out.push({ pass: 1, id: r.id, detail: `paints a ${r.border}px border AND a background (${r.bg}) inside a wrapper drawn tight around it (${r.h}px in ${r.parentH}px) — a second box inside the first` });
        else if (tight && r.border > 0) out.push({ pass: 1, id: r.id, detail: `paints a ${r.border}px border inside a wrapper drawn tight around it (${r.h}px in ${r.parentH}px) that already has one` });
        else if (tight && r.selfPaintsBg) out.push({ pass: 1, id: r.id, detail: `paints its own background (${r.bg}) inside a wrapper drawn tight around it that already paints one` });
        if (r.h - r.parentH > 1) out.push({ pass: 1, id: r.id, detail: `is ${r.h}px tall inside a ${r.parentH}px wrapper — it overflows its own container` });
    }
    return out;
}

// PASS 3 · SPACE — content clipped to nothing, and a page that scrolls sideways.
// ⚠️ The visually-hidden pattern is a 1px clipped box ON PURPOSE. A pass that cannot tell it from a broken one reports the accessibility affordance as the defect, so the collector marks it and this ignores it.
function pass3Space(records) {
    const out = [];
    for (const r of records.clipped || []) {
        if (r.srOnly) continue;
        out.push({ pass: 3, id: r.id, detail: `renders ${r.w}x${r.h}px while holding ${r.textLen} characters — visible to a screen reader and to nobody else` });
    }
    for (const r of records.overflow || []) {
        out.push({ pass: 3, id: r.id, detail: `scrollWidth ${r.scrollW} exceeds its ${r.clientW}px box with overflow-x:${r.overflowX} — the page scrolls sideways` });
    }
    return out;
}

// PASS 4 · KEYBOARD — reachability, and modality meaning what it claims.
// 🔴 `.states.html`'s PASS 4 exists because nobody had ever tabbed through a realm, and its 4g case exists because a drawer claimed to be modal and Tab walked straight out of it. `inert` on the header stops the pointer and the tab order and does NOT stop a document-level keydown — so "the background is inert" and "the background is unreachable" are two claims, and only one of them is checked here.
function pass4Keyboard(records) {
    const out = [];
    for (const r of records.unreachable || []) {
        out.push({ pass: 4, id: r.id, detail: `is a visible ${r.role || r.tag} that no Tab can reach (${r.why})` });
    }
    if (records.modal && records.modal.open) {
        for (const r of records.modal.escapees || []) {
            out.push({ pass: 4, id: r.id, detail: `is focusable OUTSIDE the open ${records.modal.kind} — Tab walks out of something that claims to be modal` });
        }
    }
    return out;
}

// PASS 5 · MOTION — what still moves when the reader has asked for less of it.
//
// ⚠️ IT ONLY JUDGES A STATE THAT DECLARED reduceMotion. Reading the animation list in an ordinary state and calling a running animation a defect would flag the design working as intended; the question is only ever "does this stop when asked".
//
// 🔴 THIS PASS WAS FILED AS "not implementable in a rendered walk" AND THAT WAS WRONG. The claim was that every honest assertion about reduced motion is about what the STYLESHEET DECLARES. It is not: a media query is emulable, and `document.getAnimations()` answers what is actually RUNNING under it — which is the property that matters and the one a source scan genuinely cannot see. The stylesheet declaring 20 reduced-motion rules says nothing about whether the one animation still on screen is covered by them.
const MOTION_FLOOR_MS = 120;                                                             // a transition this short is a state change landing, not an animation the reader is being asked to sit through
function pass5Motion(records) {
    if (!records.reducedMotion) return [];
    return (records.animations || [])
        .filter((a) => (a.duration || 0) > MOTION_FLOOR_MS)
        .map((a) => ({ pass: 5, id: a.el, detail: `runs "${a.name}" for ${a.duration}ms${a.iterations === null ? ', forever,' : ''} while the reader has asked for reduced motion` }));
}

function runPasses(records) {
    return [...pass1Composite(records), ...pass3Space(records), ...pass4Keyboard(records), ...pass5Motion(records)];
}

// A finding is identified by pass + element id, so a baseline entry names a specific defect on a specific element rather than a count. A count can stay still while the defect moves.
const keyOf = (f) => `${f.pass}:${f.id}`;

function diffAgainstKnown(findings, known = []) {
    const was = new Set(known);
    const now = findings.map(keyOf);
    return {
        fresh: findings.filter((f) => !was.has(keyOf(f))),
        fixed: [...was].filter((k) => !now.includes(k)),
    };
}


// 🔴 A FIXED SLEEP IS LOAD-DEPENDENT, WHICH MAKES THE GATE ITSELF NON-DETERMINISTIC — and that is
// worse than a slow gate, because a red run sends the next session hunting a defect that is not
// there. Measured 2026-08-30 17:5x EDT: `portalStates.mjs --ci` failed inside a full `npm test` on
// "identity closed again from the header's dead space", then passed four times run alone and once
// more under `--ci`. The state already carried the longest `waitMs` in the whole registry (700,
// against a 160 default) because an earlier session hit the same thing and raised the number —
// which is the instance fix, and it does not survive a loaded machine.
//
// `until` is the class fix: name the element the NEXT step needs and POLL for it, so a slow machine
// waits as long as it must and a fast one does not wait at all. `waitMs` stays for the steps whose
// effect is not an element appearing (a value settling, an animation starting), and for the `slow`
// state, which exists to be measured mid-flight and must NEVER wait for its subject to arrive.
function stepSettle(step = {}) {
    if (step.until) return { until: step.until, timeoutMs: step.untilMs || 5000, sleepMs: step.waitMs || 0 };
    return { until: null, timeoutMs: 0, sleepMs: step.waitMs === undefined ? 160 : step.waitMs };
}

module.exports = { pass1Composite, pass3Space, pass4Keyboard, pass5Motion, runPasses, diffAgainstKnown, keyOf, stepSettle };
