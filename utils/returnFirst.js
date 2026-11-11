// utils/returnFirst.js -- the way back sits on the far left of every row in /manage (Harkirat, 2026-11-11 11:02 EST: "the back/home return buttons should always be on the far most left side").
//
// A return button is one wearing the return-arrow emoji (Home, Back, Cancel, Back to List, Draws Home, a list's own name). Every /manage panel's row() helper passes its components through here, so a row built in any order still puts its ways back first, in the order they were given. Rows of selects are untouched. Tested by scripts/manageDraws.test.js over every draws view.
const emojis = require('./emojiMap');

function isReturn(c) {
    if (!c || c.type !== 2 || !c.emoji) return false;
    const back = emojis.parseEmoji(emojis.returnArrow) || {};
    return Boolean(back.id) ? String(c.emoji.id) === String(back.id) : c.emoji.name === back.name;
}

function returnFirst(components) {
    const list = (components || []).filter(Boolean);
    return [...list.filter(isReturn), ...list.filter(c => !isReturn(c))];
}

module.exports = { returnFirst, isReturn };
