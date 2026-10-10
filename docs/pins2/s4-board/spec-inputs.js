// spec-board, plan Step 4 group 4 (2026-10-08 23:40 EDT): the inputs on the board, on the shared engine (spec-buttons.js). Fields are measured as fields (C0, C1 L, C13);
// the stepper as a container on the field ground (44 = L) holding its buttons one size down (C3); the colour and date pickers drawn whole with their parts
// measured (no rule sizes them yet: Q9, Q10), the date picker with a switch that lays today's 36 day, M 32 or L 44 on its days to see before he decides.
import { makeOnBoard } from './spec-buttons.js';
const F = ['div.f-fld.f-code', 'div.f-fld.f-key', 'div.f-fld:has(> input[placeholder^=Like])', '#c-broadcast :has(> input[placeholder^=Search])', '#c-history :has(> input[placeholder^=Search])', 'div.dwfield.pb-txf'];
const D = ['button.b3-dp-d:not(.today):not(.out):not(.on)', 'button.b3-dp-d.today', 'button.b3-dp-d.out', 'button.b3-dp-d.on'];
const INPUTS = { group: 'inputs', sec: 'inputs', title: 'Inputs', type: 'button', rowmap: { 28: 'M', 40: 'L' },
  field: Object.fromEntries(F.map((s) => [s, s === 'div.dwfield.pb-txf' ? 'multi' : 1])),
  // a width the board's container sets (a drawer column, a grid's day column): the clone takes it
  width: Object.fromEntries([...F, 'div.acx', ...D].map((s) => [s, true])), wide: Object.fromEntries([...F.map((s) => [s, 'its row sets its width']), ['div.acx', 'its drawer column sets its width'], ...D.map((s) => [s, "the grid's 36 column sets its width"])]),
  box: { 'button.b3-dp-d.today': 'it draws only its 4px dot' },
  rail: { 'div.pb-step': 'L' },
  whole: { 'div.acx': [['panel', ':scope'], ['square', '.acx-sv'], ['hue bar', '.acx-hue'], ['swatch', '.acx-s'], ['hex field', 'input'], ['new colour', '.acx-new']],
    'div.b3-datepop': [['pop', ':scope'], ['day', '.b3-dp-d'], ['month arrows', '.b3-dp-nav'], ['weekday', '.b3-dp-wd'], ['month', '.b3-dp-ch b']] },
  names: { 'div.f-fld.f-code': 'field-L-text.entry-code--mono', 'div.f-fld.f-key': 'field-L-text.entry-key--mono', 'div.f-fld:has(> input[placeholder^=Like])': 'field-L-text.entry',
    '#c-broadcast :has(> input[placeholder^=Search])': 'field-L-search.filter', '#c-history :has(> input[placeholder^=Search])': 'field-L-search.filter', 'div.dwfield.pb-txf': 'field-L-area.entry',
    'div.pb-step': 'stepper-L-box', 'div.acx': 'colour-picker', 'div.b3-datepop': 'date-picker' },
  calls: { 'div.acx': ['q9'], 'div.b3-datepop': ['q10'] },   /* 2026-10-09 19:37 EDT: each call inside the card it decides */
  offTags: { 36: 'Q10' },   /* Q10's proposal (M 32) is laid on the whole date picker by its switch, which opens on it; a lone day cell shrinks to its digit when sized out of its grid */ qtag: { 'div.acx': 'Q9', 'div.b3-datepop': 'Q10' },
  // 2026-10-09 13:09 EDT: Q9 drawn as a proposal: a swatch is a button, so S 24 (corner 6); the panel takes Q11's corner 12; the square and the hue bar (12 on a 44 click strip) stay
  propose: { 'div.acx': { q: 'Q9', note: 'swatch S 24, corner 6 (a button on the size table) · panel corner 12 (Q11) · square and hue bar kept', set: [[':scope', { 'border-radius': '12px' }], ['.acx-s', { width: '24px', height: '24px', 'min-width': '24px', 'border-radius': '6px', flex: 'none' }]] } },
  // every family input-sweep.cjs finds is drawn here, already on the page, or set aside with its reason
  sweepEx: { 'input[type=text]': 'the input inside a field, drawn with its field (here and under Search fields)', 'input.f-in[type=text][role=combobox]': 'the input inside a dropdown, drawn under Search fields',
    'input.f-in.mono[type=text]': 'the input inside the code and key fields, drawn with them', 'input.f-in[type=text]': 'the input inside a field, drawn with it', 'textarea': 'the Post body, drawn with its field',
    'textarea.b4-tbm': 'inside the Post body field, drawn with it', 'div.acx-sv[role=slider]': 'a part of the colour picker, drawn whole and measured', 'div.acx-huew': 'a part of the colour picker, drawn whole and measured',
    'div.acx-hue[role=slider]': 'a part of the colour picker, drawn whole and measured', 'div.b3-dp-cal': 'a part of the date picker, drawn whole', 'div.b3-dp-grid': 'a part of the date picker, drawn whole' } };
export function makeInputs(L) {
  const { html, useState } = L;
  // Q10: the day's row, shown before he decides (his pattern for the selection bar): today 36 · M 32 · L 44, laid by spec.css on the clone
  function DaySize({ children }) {
    const [z, setZ] = useState('32');   /* opens on the proposal (Q10: M 32; 36 is off the table, 44 makes the grid 308 wide) */
    return html`<div class="dpz"><div class="accsw" role="group" aria-label="Day size">${[['36', 'today · 36'], ['32', 'M · 32 · proposed'], ['44', 'L · 44']].map(([k, t]) => html`<button type="button" class=${'acc' + (z === k ? ' on' : '')} aria-pressed=${z === k ? 'true' : 'false'} onClick=${() => setZ(k)}>${t}</button>`)}</div><div class=${'dpz-' + z}>${children}</div></div>`;
  }
  return { Inputs: makeOnBoard(L, { ...INPUTS, wrap: { 'div.b3-datepop': DaySize } }).Section };
}
