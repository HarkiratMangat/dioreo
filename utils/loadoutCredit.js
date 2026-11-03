// utils/loadoutCredit.js
//
// Who a build is credited to, in one place (Harkirat, 2026-11-02 10:44 EST: a manual "submitted by @user" on a build, plus a credit that is a plain name, not clickable). Two stored fields, never both at once:
//   - `submittedBy {discordId, credited}`: a Discord user. Submit a Build sets it (utils/buildSubmissions.js), and so do /manage's Credit button and /autobuild's `submitted_by:`. `credited: false` keeps them anonymous to players.
//   - `credit`: a plain name for someone with no Discord link, set by the same Credit button or /autobuild's `credit:`.
// The card's footer reads them through creditLine(); the op that changes them is core/ops/loadouts.js `loadout.credit`, so Revert works.
const { escapeMarkdown } = require('discord.js');

const CREDIT_MAX = 32;

// A typed name, tidied, or null when it can't be shown: empty, too long, a new line, or < > (which would let `<@id>` or `<t:…>` markup through).
function cleanCreditName(raw) {
    const s = String(raw ?? '');
    if (/[<>\r\n]/.test(s)) return null;
    const t = s.replace(/\s+/g, ' ').trim();
    return t && t.length <= CREDIT_MAX ? t : null;
}

// The footer's credit, or null. A plain name wins if both were ever stored; the mention never pings (every send goes out with no allowed mentions).
function creditLine(build) {
    if (build?.credit) return `Credit: ${escapeMarkdown(build.credit)}`;
    const sub = build?.submittedBy;
    if (sub?.discordId) return sub.credited ? `Submitted by <@${sub.discordId}>` : 'Submitted by *anonymous*';
    return null;
}

module.exports = { CREDIT_MAX, cleanCreditName, creditLine };
