// utils/titleBlock.js
// Shared two-line header pattern introduced across calendar/draws/patchnotes/drawprices in the
// same redesign pass: a smaller context line (season title, patch name, or region) on top, with
// the command's own animated-emoji header as the bigger line below it. Centralized here instead of
// copy-pasted in each command so the four stay visually identical and any future tweak (spacing,
// heading levels) only needs to happen once.
function buildTitleBlock(topLine, emoji, label) {
    return { type: 10, content: `## ${topLine}\n# ${emoji} ${label}` };
}

module.exports = { buildTitleBlock };
