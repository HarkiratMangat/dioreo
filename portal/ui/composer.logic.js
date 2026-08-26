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

// 🔴 THE GHOST'S PAYLOAD IS DERIVED HERE so it can be tested in Node — the component that draws it is ESM the browser loads and Node cannot require, which is the same reason every other .logic.js sibling exists.
//
// ⚠️ IT REPORTS THE RESOLVED ISO, NEVER THE TYPED TEXT. `aText` is only what the field shows, so a repaint does not discard half-typed words; `aIso` is what the bot's own parser returned over HTTP. A ghost placed from raw text would slide around the axis while somebody types "sep" on the way to "sep 21", and would land on a day nobody chose.
//
// ⚠️ A POINT'S END IS ITS START. A draw has one date and no end — the record has no second field — so an end derived from an empty `bIso` has to collapse onto the start rather than become today, or NaN, or a bar the record cannot have.
function composeGhostFor(state, type) {
    if (!state || !state.type || !state.aIso) return null;
    const shape = type ? type.shape : 'point';
    return {
        lane: state.type,
        name: state.name || '',
        start: state.aIso,
        end: shape === 'point' ? state.aIso : (state.bIso || state.aIso),
        shape,
    };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { composerReason, composerFields, composeGhostFor };
