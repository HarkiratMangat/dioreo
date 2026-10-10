// portal/ui/tips.logic.js — classic <script> in the browser, CommonJS in Node. See track.js's header for why every .logic.js sibling loads that way.
//
// 🔴 FOURTEEN `data-tip` ATTRIBUTES AND NOTHING READ THEM. The attribute is written in four portal files — the Track's lane headers, its drag handles, the deadline rail, Review's rollback note — and the portal had no tooltip runtime at all, so every one of those sentences was markup nobody could reach. `.tip` and `.tip .sub` sat defined and unused in the adopted stylesheet, which is what made it invisible: an orphan check asks whether a class has a RULE, and these had one.
//
// ⚠️ A NATIVE `title` IS NOT THE SAME THING and is not the fix. It is OS chrome — delayed, unstyled, and rendered UNDER the pointer, so it covers the very thing it describes. `title` stays for supplementary hints; anything a person is meant to READ uses `data-tip`.
//
// The placement arithmetic lives here because it fails at the EDGES, which is exactly where a hand-check does not look: a tip on the rightmost lane flows off screen, and a tall one on the top row is clipped by the viewport rather than by anything visible.
const TIP_GAP = 10;     // between the mark and the tip — beside it, never over it
const TIP_EDGE = 8;     // the viewport margin the tip is clamped inside

function tipPlacement(host, tip, viewport) {
    const vw = viewport.width, vh = viewport.height;
    // Prefer the right, because reading order puts the explanation after the thing explained.
    let side = 'right';
    let x = host.right + TIP_GAP;
    if (x + tip.width > vw - TIP_EDGE) {
        side = 'left';
        x = host.left - tip.width - TIP_GAP;
    }
    // ⚠️ A FLIP CAN STILL OVERFLOW. A tip wider than the space on either side of a centred mark goes off the LEFT edge once flipped — clamping only the right edge leaves the failure in the other direction, which is the half a hand-check never reaches.
    if (x < TIP_EDGE) { x = TIP_EDGE; side = 'clamped'; }

    const centred = host.top + host.height / 2 - tip.height / 2;
    const y = Math.min(Math.max(TIP_EDGE, centred), Math.max(TIP_EDGE, vh - tip.height - TIP_EDGE));
    return { x: Math.round(x), y: Math.round(y), side };
}

// The first line is the statement; every line after it is the qualification, and the stylesheet gives those their own smaller, quieter row. Splitting here rather than at each call site means a caller writes a newline and gets the treatment.
function tipLines(text) {
    return String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tipPlacement, tipLines, TIP_GAP, TIP_EDGE };
}
