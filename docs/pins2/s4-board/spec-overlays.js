// spec-board, plan Step 4 group 5 (2026-10-08 23:51 EDT): the overlays on the board, on the shared engine (spec-buttons.js). A drawer is too large to stand in a card, so its
// frame is measured in a table and its header strip drawn whole; the problem pop-up drawn under Pop-ups; the toast is the board's own chrome (his Q11 note). No rule sizes a floating
// surface yet (Q11: one corner and one padding for every one?). Tooltips are off across the portal (his 2026-09-11 14:20 EDT); no Builder-2 state opens Confirm.
import { makeOnBoard } from './spec-buttons.js';
const HD = ['aside.drawer.wide:not(.b1) > header.dw-h', 'aside.drawer:not(.wide) > header.dw-h', 'aside.b1.drawer > header.dw-h'];
const FR = [['New build drawer', 'aside.drawer.wide:not(.b1)'], ['Export drawer', 'aside.drawer:not(.wide)'], ['Post drawer', 'aside.b1.drawer'], ['scrim', 'div.scrim']];
const HEAD = [['header', ':scope'], ['eyebrow', '.dw-eye'], ['title', 'h2'], ['close', 'button.x:not(.bk)'], ['back', 'button.bk']];
const OVERLAYS = { group: 'overlays', sec: 'overlays', title: 'Overlays', type: 'button',
  wholeHead: ['Drawn whole', 'as the board draws them, their parts measured; no rule sizes a floating surface yet (Q11)'],
  table: { note: 'measured on the board: no rule sizes a floating surface yet (Q11)', rows: FR,
    propose: { 'aside.drawer.wide:not(.b1)': 'corner 12 · padding 20', 'aside.drawer:not(.wide)': 'corner 12 · padding 20', 'aside.b1.drawer': 'corner 12 · padding 20' } },
  // 2026-10-09 13:09 EDT: Q11 drawn as a proposal (his 11:49 EDT "draw the corrected proposed state")
  // 2026-10-10 19:07 EDT: the toast proposal withdrawn, his Q11 note (2026-10-09 22:48 EDT): "the toast is part of the builder-2 board chrome."
  propose: {},
  exclude: { ...Object.fromEntries(FR.map(([l, s]) => [s, 'measured in the frame table'])), 'div.b3-pc': 'drawn live under Pop-ups (a copy of its markup has no outline or placement; 2026-10-09 15:30 EDT)', 'div.toast': 'the Builder-2 board\'s own chrome, not a portal surface (his Q11 note)' },
  whole: { ...Object.fromEntries(HD.map((s) => [s, HEAD])), 'div.b3-pc': [['pop-up', ':scope'], ['close', 'button']] },
  wide: Object.fromEntries(HD.map((s) => [s, "the drawer sets its width; here the stage's"])),
  names: { ...Object.fromEntries(HD.map((s) => [s, 'drawer-header'])), 'div.b3-pc': 'pop-up.problem' },
  qtag: { 'div.b3-pc': 'Q11' },
  sweepEx: { 'div.scrim': 'measured in the frame table', 'aside.drawer[role=dialog]': 'measured in the frame table; its header drawn', 'aside.drawer.wide[role=dialog]': 'measured in the frame table; its header drawn',
    'aside.b1.drawer.wide[role=dialog]': 'measured in the frame table; its header drawn', 'div.b3-datepop.b4-pop.t-warn[role=dialog]': 'drawn under Inputs', 'div.b3-pc.b3-pc-fixed.pinned.pop-s1[role=dialog]': 'the problem card, drawn live under Pop-ups' } };
export function makeOverlays(L) { return { Overlays: makeOnBoard(L, OVERLAYS).Section }; }
