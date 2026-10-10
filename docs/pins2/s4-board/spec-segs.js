// spec-board, plan Step 4 group 3 (2026-10-08 21:50 EDT): segmented controls and switches on the board, on the shared engine (spec-buttons.js). A rail is drawn whole
// and measured as a rail (C3, R9: its row one size up from its selected segment, half the step around); a group with no box is drawn by its first segment;
// filter chips follow C4; the switch carries its decided name (the Post drawer's row in the ledger). Free-standing 28s and 40s follow his Q3.
import { makeOnBoard } from './spec-buttons.js';
const SEGS = { group: 'segs', sec: 'segs', title: 'Segmented and switches', type: 'button', rowmap: { 28: 'M', 40: 'L' },
  rail: { 'div.seg:not(.pb-seg)': 1, 'div.f-src': 1 },
  // 2026-10-09 16:35 EDT: History's empty filter chip leads with its count meter; on the corrected copy the meter takes the icon's slot (ledger row fcnone: padding 10, the count nested)
  iconSel: { 'button.b3-fc.none': '.b3-meter' },
  states: true,   /* 2026-10-09 15:22 EDT: each one drawn selected, unselected and under the pointer, and the live copy answers clicks (his 11:49 EDT) */
  wide: { 'div.f-src': 'its row sets its width' }, width: { 'div.f-src': true },
  decided: { 'button.pb-sw': ['switch-S-pill.fill', 'S', 'post'] },
  // every family seg-sweep.cjs finds is drawn here, already on the page, or set aside with its reason
  sweepEx: { 'button': 'buttons that carry aria-pressed, drawn in their own groups', 'button.b3-dp-d': 'a date picker day (inputs)', 'button.b3-dp-d.today': 'a date picker day (inputs)', 'div.b3-dp-grid': 'the date picker (inputs)',
    'button.acx-s': 'a colour swatch (inputs)', 'div.acx-full.acx-s': 'a colour swatch (inputs)', 'button.b3-rv.warn': 'the Repairs launcher, under Chips and tags', 'div.cx-keys': 'a row of Compare keys, each key drawn', 'div.b3-rp-f': 'a row of filter chips, each chip drawn',
    'button.f-tier': 'a segment of the tier picker, drawn by its selected one', 'div.f-tiers': 'drawn by its selected segment (a group with no box)', 'div.pb-seg.seg': "the gate's own scenario picker in its head (board chrome)", 'div.b3-xt-mode.mh-mode': 'drawn by its segment (a group with no box)' } };
export function makeSegs(L) { return { Segs: makeOnBoard(L, SEGS).Section }; }
