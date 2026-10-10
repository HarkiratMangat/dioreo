// POP-UP TIMING — ONE TABLE. His spec, 2026-09-30 18:18 EDT: every pop-up is one of three sets, chosen by how it opens.
//   1 · a hover pop-up that informs (the problem and all-pass cards, Stage deletion) — Open: wait > fade > grow. Close: wait > fade (with the shrink) > removed.
//   2 · any other hover pop-up (the image mark, hints, Export's peek)             — Open: wait > fade.        Close: wait > fade > removed.
//   3 · a pop-up a button opens, never a hover (the date, repeat and start-date pickers) — Open: fade. Close: fade > removed.
// The waits are for the MOUSE only: a click, Tab or Escape opens and closes at once. Once a card is open, the next one hovered opens without its wait and
// the open one leaves at once (the handoff). "removed" counts from the start of the fade. He may retune these after trying them: change them HERE only —
// the CSS reads them as --pop<set>-<name> (set on the root below), the components read POPT.
export const POPT = {
    // 2026-09-30 18:31 EDT, his: "slightly refine them to be more smoother? i think i made them too fast" — was 1: 120·70·600 | 140·110(+160)·200,
    // 2: 120·160 | 140·110·200, 3: 160 | 140·200. The fades are longer and set 1's are eased (they were linear), the close waits 160 so the mouse can reach a card.
    // 2026-09-30 19:25 EDT, his: "none of the image mark animations morph their arc anymore. it's just a straight fade in." — `arc` is the outline's morph out of
    // the edge, the pop-up container's own motion, and it runs in EVERY set; only set 1's body grows. V77 had switched it off for sets 2 and 3.
    1: { openWait: 120, fadeIn: 140, grow: 600, arc: 600, closeWait: 160, fadeOut: 180, shrink: 220, removed: 260 },
    2: { openWait: 120, fadeIn: 220, arc: 600, closeWait: 160, fadeOut: 180, removed: 240 },
    3: { fadeIn: 200, arc: 600, fadeOut: 180, removed: 220 },
};
// a card removed before its fade or shrink ends is cut mid-motion: a retune that breaks this says so
for (const [k, v] of Object.entries(POPT)) if (v.removed < Math.max(v.fadeOut || 0, v.shrink || 0)) console.warn(`POPT[${k}]: removed ${v.removed}ms ends before the close motion`);
if (typeof document !== 'undefined') {
    const s = document.documentElement.style;
    for (const [k, v] of Object.entries(POPT)) for (const [n, ms] of Object.entries(v)) s.setProperty(`--pop${k}-${n}`, `${ms}ms`);
}
