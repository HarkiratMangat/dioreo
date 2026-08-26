// portal/ui/useMeasured.js — ESM. The one safe way to run a POST-LAYOUT MEASURING PASS in this
// portal, and the reason it exists is a defect class the migration hit on its very first component.
//
// 🔴 A MEASURING PASS THAT MUTATES CLASS NAMES OSCILLATES UNDER DECLARATIVE RENDERING.
// The mockup's Track measures a bar and adds `lbl-out` / `lbl-cut` / `nolabel` to it. Ported
// straight into useLayoutEffect with an old-vs-new comparison guard, it locked a browser hard
// enough to time out a 300-second call: `lbl-cut` truncates the label, which changes the label's
// clientWidth, which flips `clipped`, which picks a different branch — a TWO-CYCLE, and no
// compare-the-previous-result guard can break a cycle of length two. It alternates forever.
//
// Two rules make it safe, and neither is optional:
//   1. MEASURE ONCE PER REAL INPUT CHANGE, never in response to your own setState. That is what
//      the generation `key` is: a string built from the things that genuinely change the geometry
//      (the visible window, the items, which lanes are collapsed). Re-running because the state
//      you just set caused a render is the loop.
//   2. MEASURE UNCONSTRAINED. Strip whatever the last pass applied before reading geometry, so
//      every pass reads the same numbers the first one did. The imperative original did exactly
//      this for the same reason; it is not an artefact of the port.
//
// ✅ IT ALSO DELETES A SHIPPED DEFECT FOR FREE. The mockup's own comment records that "EVERY
// MEASURING PASS LIVED IN repositionBars(), WHICH DOES NOT RUN ON FIRST PAINT" — a freshly loaded
// Track rendered "We⋮ We⋮ We⋮" where five event labels belonged, and only a zoom ever corrected it.
// A layout effect runs after the first paint and every subsequent one, by definition.
//
// The mockup has SEVEN passes of this shape — fitLabels, clusterPoints, fitFlags, pinFarDeadlines,
// pinClippedLabels, stackFlags, repositionBars. Every one of them migrates through here.
import { useState, useLayoutEffect, useRef } from '../vendor/preact-hooks.mjs';

// `key`      — a string that changes ONLY when the geometry inputs change.
// `measure`  — (root) => ({ id: value }). Called after layout, with the classes it produced last
//              time already stripped by `reset`.
// `ref`      — a ref to the subtree to measure.
// `reset`    — (root) => void. Removes whatever the previous pass applied. Runs before `measure`.
//
// Returns the map. Render it back through the tree; never write it to the DOM yourself, or the
// next render will silently discard it.
export function useMeasured(key, ref, measure, reset) {
    const [result, setResult] = useState({});
    const measuredFor = useRef(null);
    useLayoutEffect(() => {
        const root = ref.current;
        if (!root) return;
        if (measuredFor.current === key) return;   // rule 1 — never re-enter on our own setState
        measuredFor.current = key;
        if (reset) reset(root);                    // rule 2 — read unconstrained geometry
        setResult(measure(root));
    });
    return result;
}
