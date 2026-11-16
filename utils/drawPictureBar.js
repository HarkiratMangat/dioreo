// utils/drawPictureBar.js -- finds the black logo bar many draw posters carry at the bottom (the Garena / CALL OF DUTY: MOBILE strip), so Upload Draws can crop it off (Harkirat, 2026-11-16 12:47 EST: "some do, some don't but it is common").
//
// The first import (2026-11-01, docs/reference/draw-index.md) cropped an 89px bar off 61 of 75 posters by hand after a scan that measured any dark bottom band: dark ART at the bottom of a poster looked the same, so the scan alone was wrong about half the time. This one asks for what only the logo bar has, all of it:
//   - its left and right margins are pure black on every row (art is not, even when dark);
//   - its middle carries something bright on some row (the logos);
//   - the row just above it is NOT black at the margins (a sharp edge where the art starts);
//   - it is 3% to 12% of the picture's height.
// Checked against the first import's own decisions (scripts/drawPictureBar.test.js, and the full set on this Mac in local/). PURE over decoded pixels: `bottomBar(bitmap)` -> rows to crop, 0 when there is no bar.
const EDGE = 0.2;          // the left and right fifth of each row
const BLACK = 28;          // a channel at or under this is black (JPEG noise lifts pure black a little)
const EDGE_BLACK_SHARE = 0.97;
const BRIGHT = 120;
const MIN_SHARE = 0.03;
const MAX_SHARE = 0.12;

function rowStats(bitmap, y) {
    const { width, data } = bitmap;
    const edge = Math.max(1, Math.floor(width * EDGE));
    let edgeBlack = 0; let edgeTotal = 0; let bright = 0;
    for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const max = Math.max(data[i], data[i + 1], data[i + 2]);
        if (x < edge || x >= width - edge) { edgeTotal++; if (max <= BLACK) edgeBlack++; }
        else if (max >= BRIGHT) bright++;
    }
    return { edgeShare: edgeBlack / edgeTotal, bright };
}

// THE TEMPLATE (measured 2026-11-16 12:49 EST on the first import's posters): the bar is one fixed design scaled with the picture's width, 89 rows on a 1080-wide poster, black margins on every row, and the two logos lit only in its middle band (rows 28-57 from the bottom at 1080 wide) with black rows above and below them. Checked first and cropped to exactly that height, so dark art above the bar neither hides it nor gets cut with it.
const BAR_PER_WIDTH = 89 / 1080;
function templateBar(bitmap) {
    const { width, height } = bitmap;
    const bar = Math.round(width * BAR_PER_WIDTH);
    if (bar < 8 || bar > height * MAX_SHARE * 1.5) return 0;
    // The logos sit in the bar's middle; two variants measured put them in rows 18-51 and, with a glow, 9-69 at 1080 wide. So: lit rows only between 6% and 85% of the bar, and at least a quarter of the bar lit.
    const lo = Math.round(bar * 0.06), hi = Math.round(bar * 0.85);
    let logoRows = 0;
    for (let k = 0; k < bar; k++) {
        const st = rowStats(bitmap, height - 1 - k);
        // The bar's top two rows meet the art, and JPEG blurs that edge, so they need only be mostly black.
        if (st.edgeShare < (k >= bar - 2 ? 0.4 : EDGE_BLACK_SHARE)) return 0;
        if (st.bright > 0 && (k < lo || k > hi)) return 0;
        if (st.bright > 0) logoRows++;
    }
    // The two logos light about 30 rows of 89 at 1080 wide (rows 28-57); a quarter of the bar is the floor, so the narrowest variant still counts.
    return logoRows >= Math.round(bar / 4) ? bar : 0;
}

function bottomBar(bitmap) {
    const { height } = bitmap || {};
    if (!height || !bitmap.width || !bitmap.data) return 0;
    const t = templateBar(bitmap);
    if (t) return t;
    let rows = 0;
    let logo = false;
    for (let y = height - 1; y >= 0; y--) {
        const s = rowStats(bitmap, y);
        if (s.edgeShare < EDGE_BLACK_SHARE) break;
        if (s.bright > 0) logo = true;
        rows++;
        if (rows > height * MAX_SHARE) return 0;
    }
    if (!logo || rows < height * MIN_SHARE) return 0;
    // The edge: the row above the bar must be art, not more black.
    const above = height - rows - 1;
    if (above < 0 || rowStats(bitmap, above).edgeShare >= 0.6) return 0;
    return rows;
}

// Bytes -> { width, height, bar }. Never throws: a picture it cannot decode has no bar.
async function measure(buffer) {
    try {
        const { Jimp } = require('jimp');
        const img = await Jimp.read(buffer);
        return { width: img.bitmap.width, height: img.bitmap.height, bar: bottomBar(img.bitmap) };
    } catch { return { width: 0, height: 0, bar: 0 }; }
}

module.exports = { bottomBar, templateBar, measure, rowStats };
