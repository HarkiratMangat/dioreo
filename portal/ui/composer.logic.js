// portal/ui/composer.logic.js — CommonJS + classic script. The pure half of the in-page composer.

// 🔴 THE REASON, NOT A BOOLEAN. A disabled Stage button that will not say why is a dead end: you are looking at a form with four fields and no indication which one is holding it. This returns the sentence the composer prints beside the button, and `null` when there is nothing standing in the way — so "is it ready" and "why not" are one answer rather than two that can disagree.
function composerReason(state, type) {
    if (!type) return 'Pick what you are adding.';
    if (!String(state.name || '').trim()) return 'Give it a name.';
    if (!state.aIso) {
        // An unparsed value is a DIFFERENT failure from an empty one, and saying so is the whole point of parsing as you type: "not a date yet" tells you the field is being read and rejected, where "set a date" reads as though you had not typed anything.
        return String(state.aText || '').trim() ? 'That first date does not resolve to a day yet.' : 'Set a date.';
    }
    if (type.shape === 'span') {
        if (!state.bIso) return String(state.bText || '').trim() ? 'That second date does not resolve to a day yet.' : 'Set a closing date.';
        if (state.bIso < state.aIso) return 'It closes before it opens.';
    }
    return null;
}

// What the composer hands its caller. Deliberately the SAME field names the existing buildSeasonAddOp already takes, so the composer replaces a form rather than introducing a second vocabulary for the same act.
function composerFields(state, type) {
    if (type.shape === 'span') return { title: state.name.trim(), startDate: state.aIso, endDate: state.bIso };
    // A point has one date, and it is the END date: a draw's schema field is `date` and buildSeasonAddOp reads it from `endDate`. Putting it in `startDate` would stage a draw with no date at all.
    return { title: state.name.trim(), startDate: '', endDate: state.aIso };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { composerReason, composerFields };
