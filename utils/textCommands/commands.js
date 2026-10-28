// utils/textCommands/commands.js -- which slash commands a text command can run, and every way to spell each (text commands, PR 1, 2026-10-28 17:24 EDT). PR 1 is every public command that needs no options (Harkirat, 2026-10-28 17:08 EDT: "sure"). `slash` + `sub` name the real command module, so a text command runs exactly the code its slash command runs.
//
// A spelling is an ALIAS, never a typo: utils/textCommands/parse.js forgives typos separately and only within strict limits, so a plural or a short form belongs here rather than being left for the typo rule to catch.
const TEXT_COMMANDS = [
    { name: 'today', slash: 'today', words: ['today'] },
    { name: 'draws', slash: 'draws', words: ['draws'] },
    { name: 'calendar', slash: 'calendar', words: ['calendar', 'cal'] },
    { name: 'patch notes', slash: 'patch', sub: 'notes', words: ['patch notes', 'patchnotes', 'patch', 'notes'] },
    { name: 'season end', slash: 'season', sub: 'end', words: ['season end', 'seasonend', 'season'] },
    { name: 'draw prices', slash: 'draw', sub: 'prices', words: ['draw prices', 'drawprices', 'prices'] },
    { name: 'draw calculator', slash: 'draw', sub: 'calculator', words: ['draw calculator', 'drawcalculator', 'calculator', 'calc'] },
    { name: 'settings', slash: 'settings', words: ['settings', 'setting'] },
    { name: 'remind', slash: 'remind', words: ['remind', 'reminders', 'reminder'] },
    { name: 'colors', slash: 'colors', words: ['colors', 'colours', 'color'] },
    { name: 'invite', slash: 'invite', words: ['invite'] },
    { name: 'help', slash: 'help', words: ['help', 'commands'] },
];

function findTextCommand(name) {
    return TEXT_COMMANDS.find(c => c.name === name) || null;
}

// A custom_id can't carry a space reliably across every client, so a two-word name travels as `patch.notes`.
const toIdPart = name => name.replace(/ /g, '.');
const fromIdPart = part => String(part || '').replace(/\./g, ' ');

module.exports = { TEXT_COMMANDS, findTextCommand, toIdPart, fromIdPart };
