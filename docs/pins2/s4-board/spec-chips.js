// spec-board, plan Step 4 group 2 (2026-10-08 18:51 EDT): chips and tags on the board. The engine is spec-buttons.js's (cloned from the board, measured on the box
// each one draws, named from its inks); this file is the group's settings. The type word "tag" waits on Q4; a tag is not a control, so C1's words weight
// is not asked of it (C5's sizes are).
import { makeOnBoard } from './spec-buttons.js';
const CHIPS = { group: 'chips', sec: 'chips', title: 'Chips and tags', type: 'tag', weight: false, q: 'type word: Q4 · rows: Q8', offq: 'Q8',
  qtag: { '.mhits': 'Q6' },
  calls: { '.mhits': ['q6'] },   /* 2026-10-09 19:37 EDT: the count box's call inside its card */
  wide: { 'span.g-status:not(.warn)': 'its row sets its width (its words spread across it)' },
  width: { 'span.g-status:not(.warn)': true },
  // every family chip-sweep.cjs finds is drawn here, already on the page, or set aside with its reason
  sweepEx: { 'span.b3-av.sys': 'an avatar (data display)', 'span.cb': 'a checkbox (inputs)', 'span.b3-bdgs': 'a row of badges, not one', 'span.b3-bdg': 'the badge label (R11), drawn under Labels; its box height is Q7',
    'span.b3-tk-ic': 'an icon tile (data display)', 'span.b3-tk-shield': 'an icon tile (data display)', 'i.b3-pc-ic': 'an icon tile (data display)', 'span.pb-thumb': 'a thumbnail (data display)', 'span.btab': 'tabs (segmented)',
    'span.acx-none.acx-s': 'a swatch (colour picker)', 'div.acx-full.acx-s': 'a swatch (colour picker)', 'b.acx-pu': 'a swatch (colour picker)', 'b.acx-pr': 'a swatch (colour picker)', 'span.cx-shb': 'the build numbers inside a shared attachment',
    'span': "Compare's badges META and BEST AR, drawn under Labels", 'i': 'icons and dots with no words (data display)' } };
export function makeChips(L) { return { Chips: makeOnBoard(L, CHIPS).Section }; }
