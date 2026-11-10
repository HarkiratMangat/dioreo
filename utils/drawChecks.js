// utils/drawChecks.js -- what a stored draw is missing (2026-11-09, the /manage audit's finding 7: the Next Season Draft had a Needs a Look and the live draws had none). Pure, no database: the live draws panel's Needs a Look list (handlers/manage/drawsPanel/views.js) and the draft's (handlers/manage/seasonPanel/views.js) read the same rules, so a draw flagged in one is flagged in the other.
//
// No picture · still on the placeholder picture (utils/placeholders.js) · no items (a `-#` comment is not an item) · no draw type, or Unsure (utils/drawCatalog.js isKnownType: /draw calculator and /draw prices cannot price it). The live list adds "no end date" from /draws' own timing, which a draft draw does not have yet.
const { isPlaceholder } = require('./placeholders');
const { isKnownType } = require('./drawCatalog');

const CHECKS = [
    { key: 'picture', label: 'no picture', test: d => !d.thumbnailUrl },
    { key: 'placeholder', label: 'placeholder picture', test: d => Boolean(d.thumbnailUrl) && isPlaceholder(d.thumbnailUrl) },
    { key: 'items', label: 'no items', test: d => !(d.items || []).some(i => i && i.tier !== 'comment') },
    { key: 'type', label: 'no draw type', test: d => !isKnownType(d.priceType) },
];

// The labels of what `draw` lacks, in CHECKS order.
const gapsOf = (draw) => CHECKS.filter(c => c.test(draw || {})).map(c => c.label);

module.exports = { CHECKS, gapsOf };
