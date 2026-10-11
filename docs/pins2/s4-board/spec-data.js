// spec-board, plan Step 4 group 6 (2026-10-09 00:05 EDT): data display on the board, on the shared engine (spec-buttons.js). The two tables are too large for a card, so
// they are measured in a table (their header row, rows, cells and words read off the board); History's rows, the meters, the colour bar, the cards and
// the two previews are drawn whole with their parts measured. No rule sizes data display yet (Q12: row heights, card corners, meter heights).
import { makeOnBoard } from './spec-buttons.js';
const GC = ['div.g-card.g-never', 'div.g-card.pb-card:not(.g-never):not(.g-k-upcoming):not(.g-k-staged)', 'div.g-card.g-k-upcoming', 'div.g-card.g-k-staged'];
const CARD = [['card', ':scope'], ['number', '.pb-n, .g-n'], ['title', 'h3, h4, .g-t, .pb-t'], ['tag', '.pb-pill']];
const BAR = [['meter', ':scope'], ['segment', ':scope > *']];
const DATA = { group: 'data', sec: 'data', title: 'Data display', type: 'button',
  wholeHead: ['Drawn whole', 'as the board draws them, their parts measured; no rule sizes data display yet (Q12)'],
  table: { note: 'too large for a card: measured on the board, their rows and cells read (Q12)', rows: [['Broadcast manifest', 'table.mtable'], ['Compare, slot by slot', 'table.cx-t']] },
  // 2026-10-10 21:13 EDT: the announcement cards and the Discord previews are products made of many elements, not elements (his "this is a spec-board, not the full gate board … the broadcast cards are a collective product. Similarly the discord previews.")
  exclude: { 'table.mtable': 'measured in the table above', 'table.cx-t': 'measured in the table above', ...Object.fromEntries(GC.map((s) => [s, 'an announcement card: a product of many elements (his 21:02 EDT)'])), 'div.dcard.lc': 'a loadout preview: a product of many elements (his 21:02 EDT)', 'div.dcard:not(.lc)': 'a Discord preview: a product of many elements (his 21:02 EDT)' },
  whole: { 'button.b3-hi-open.what': [['row', ':scope']], 'span.b3-meter': BAR, 'span.bcbar': [['bar', ':scope']], 'div.dcard.lc': [['card', ':scope']], 'div.dcard:not(.lc)': [['preview', ':scope']],
    'span.cmeter': BAR, 'div.b3-tk-bar': BAR, ...Object.fromEntries(GC.map((s) => [s, CARD])), 'div.pb-meter2': [['meter', ':scope'], ['bar', ':scope > *']] },
  width: { ...Object.fromEntries(GC.map((s) => [s, true])), 'button.b3-hi-open.what': true, 'div.dcard.lc': true, 'div.dcard:not(.lc)': true, 'span.cmeter': true, 'div.pb-meter2': true },
  size: { 'span.b3-meter': true, 'span.bcbar': true },
  wide: { 'div.b3-tk-bar': "Repairs' width sets it; here the card's", ...Object.fromEntries(GC.map((s) => [s, 'its column sets its width'])) },
  full: { 'div.b3-tk-bar': 1, ...Object.fromEntries(GC.map((s) => [s, 1])) },
  names: { 'button.b3-hi-open.what': 'row.history', 'span.b3-meter': 'meter.severity', 'span.bcbar': 'bar.colour', 'div.dcard.lc': 'card.loadout', 'div.dcard:not(.lc)': 'card.discord-preview',
    'span.cmeter': 'meter.segments', 'div.b3-tk-bar': 'meter.track', 'div.g-card.g-never': 'card.announcement-never', [GC[1]]: 'card.announcement', 'div.g-card.g-k-upcoming': 'card.announcement-upcoming',
    'div.g-card.g-k-staged': 'card.announcement-staged', 'div.pb-meter2': 'meter.budget' },
  qtag: { 'button.b3-hi-open.what': 'Q12', 'div.g-card.g-never': 'Q12', 'span.cmeter': 'Q12' },
  // 2026-10-09 13:09 EDT: Q12 drawn as proposals: a row opens an event, so it is a control on L 44 (C0); a card is a surface, corner 12 (Q11); one bar thickness, 4
  propose: { 'button.b3-hi-open.what': { q: 'Q12', note: 'a row opens an event: a control, so L 44 (C0)', set: [[':scope', { height: '44px', 'min-height': '44px', 'box-sizing': 'border-box', 'padding-top': '0', 'padding-bottom': '0' }]] },
    ...Object.fromEntries(GC.map((s) => [s, { q: 'Q12', note: 'a card is a surface: corner 12, as Q11', set: [[':scope', { 'border-radius': '12px' }]] }])), 'div.dcard.lc': { q: 'Q12', note: 'a card is a surface: corner 12, as Q11', set: [[':scope', { 'border-radius': '12px' }]] },
    'div.b3-tk-bar': { q: 'Q12', note: 'one bar thickness, 4, as the segment meter (the 16 severity mark is a glyph, not a bar)', set: [[':scope', { height: '4px', 'border-radius': '2px' }], [':scope > *', { height: '4px' }]] } },
  sweepEx: { 'div.pb-bar': "a toolbar row (its buttons drawn under On the board)", 'div.b3-sd-bar': 'the selection bar, drawn in its own section', 'div.b4-bare.g-stage.pb-stage': "the gate's stage (board chrome)",
    'div.b4-bare.g-fixed.g-stage.pb-stage': "the gate's stage (board chrome)", 'table.mtable': 'measured in the table above', 'table.cx-t': 'measured in the table above' } };
export function makeData(L) { return { Data: makeOnBoard(L, DATA).Section }; }
