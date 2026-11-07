// utils/attachmentAliases.js
//
// The short names admins type for an attachment, expanded to its catalogue name before a build is saved (Harkirat, 2026-11-06 11:57 EST: "soh/SoH for sleight of hand ... and honestly think about other aliases people tend to use"). A whole attachment line that IS an alias, in any case and with any spacing or punctuation, becomes the full name; anything else is left exactly as typed, since attachment names must match the game's own. Pure, so /manage's pop-up (utils/loadoutForm.js), the bulk paste (utils/adminParser.js) and /autobuild's corrector share it. Every target is a name the catalogue already knows (checked the same day).
const ATTACHMENT_ALIASES = {
    soh: 'Sleight of Hand',
    mono: 'Monolithic Suppressor', monosup: 'Monolithic Suppressor', monosuppressor: 'Monolithic Suppressor',
    tacsup: 'Tactical Suppressor', tacsuppressor: 'Tactical Suppressor',
    gran: 'Granulated Grip Tape', granulated: 'Granulated Grip Tape', granulatedtape: 'Granulated Grip Tape',
    stippled: 'Stippled Grip Tape', stippledtape: 'Stippled Grip Tape',
    quickdraw: 'Quick Draw', rapidfire: 'Rapid Fire', longshot: 'Long Shot',
    nostock: 'No Stock',
};
const squash = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
function expandAttachmentAlias(name) {
    return ATTACHMENT_ALIASES[squash(name)] || name;
}
module.exports = { ATTACHMENT_ALIASES, expandAttachmentAlias };
