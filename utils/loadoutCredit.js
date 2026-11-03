// utils/loadoutCredit.js
//
// Who a build is credited to, in one place. His design (Harkirat, 2026-11-03 04:10 UTC, 2026-11-02 23:10 EST):
//   - how it shows (`show`): `user` an @mention (clickable) · `name` a **username** in plain text · `link` a hyperlink · `anonymous`, always "By *anonymous*" · `none`, no credit line, except that a build someone submitted still reads "By *anonymous*" (his call, 2026-11-02 23:27 EST: "if its submitted then save the by anonymous line at least")
//   - its prefix: "Submitted by", "Credit:" or "Build by"
//   - Submit a Build only ever gives "Submitted by" @user or username, or "By *anonymous*"; the hyperlink and the other two prefixes are set by hand in /manage (the hyperlink only there, so a player can never put a URL on a build). /autobuild can set a user or a name and any prefix.
// Stored as `Loadout.credit {show, prefix, discordId, name, url}`. The private `submittedBy {discordId, credited}` record stays as it was (Submit a Build keeps the submitter's ID for disputes); a build with no `credit` yet (one approved before this existed) falls back to it.
const { escapeMarkdown } = require('discord.js');

const CREDIT_MAX = 32;
const URL_MAX = 200;
const PREFIXES = { submitted: 'Submitted by', credit: 'Credit:', buildby: 'Build by' };
const SHOWS = ['user', 'name', 'link', 'anonymous', 'none'];

// A typed name, tidied, or null when it can't be shown: empty, too long, a new line, < > (which would let `<@id>` or `<t:…>` markup through), or [ ] (which would break a hyperlink's text).
function cleanCreditName(raw) {
    const s = String(raw ?? '');
    if (/[<>[\]\r\n]/.test(s)) return null;
    const t = s.replace(/\s+/g, ' ').trim();
    return t && t.length <= CREDIT_MAX ? t : null;
}

// An https link a hyperlink credit can carry, or null. Only https, one piece, nothing that would close the markdown link early.
function cleanCreditUrl(raw) {
    const s = String(raw ?? '').trim();
    if (!s || s.length > URL_MAX || /[\s<>()[\]]/.test(s)) return null;
    try { const u = new URL(s); return u.protocol === 'https:' && u.hostname.includes('.') ? u.href : null; } catch { return null; }
}

// What a form or an op hands in, to what is stored: `{ credit }`, or `{ error }` worded for the admin. `null` is "no credit field", which falls back to submittedBy.
function normalizeCredit(c) {
    if (c == null) return { credit: null };
    const show = c.show;
    if (!SHOWS.includes(show)) return { error: 'Pick how the credit shows.' };
    if (show === 'none' || show === 'anonymous') return { credit: { show } };
    const prefix = PREFIXES[c.prefix] ? c.prefix : 'submitted';
    if (show === 'user') {
        return /^\d{15,22}$/.test(String(c.discordId || '')) ? { credit: { show, prefix, discordId: String(c.discordId) } } : { error: '@user needs a Discord user.' };
    }
    const name = cleanCreditName(c.name);
    if (!name) return { error: `${show === 'link' ? 'A hyperlink needs its text: a' : 'A'} name of 1 to ${CREDIT_MAX} characters, on one line, with no < > [ or ].` };
    if (show === 'name') return { credit: { show, prefix, name } };
    const url = cleanCreditUrl(c.url);
    return url ? { credit: { show, prefix, name, url } } : { error: 'A hyperlink needs a link starting with https://.' };
}

// The credit a Submit a Build approval writes: "Submitted by" @user or username, or anonymous. `creditAs` is the form's pick; a submission sent before it existed has only `credited`.
function submissionCredit(sub) {
    const as = sub.creditAs || (sub.credited ? 'user' : 'anonymous');
    if (as === 'name' && cleanCreditName(sub.username)) return { show: 'name', prefix: 'submitted', name: cleanCreditName(sub.username) };
    if (as === 'anonymous' || !sub.discordId) return { show: 'anonymous' };
    return { show: 'user', prefix: 'submitted', discordId: String(sub.discordId) };
}

// The footer's credit, or null. The mention never pings (every send goes out with no allowed mentions).
function creditLine(build) {
    const c = build?.credit;
    if (c?.show) {
        const p = PREFIXES[c.prefix] || PREFIXES.submitted;
        if (c.show === 'anonymous') return 'By *anonymous*';
        if (c.show === 'user' && c.discordId) return `${p} <@${c.discordId}>`;
        if (c.show === 'name' && c.name) return `${p} **${escapeMarkdown(c.name)}**`;
        if (c.show === 'link' && c.name && c.url) return `${p} [${escapeMarkdown(c.name)}](${c.url})`;
        // No credit hides the line, but a submitted build always says someone sent it.
        return build.submittedBy?.discordId ? 'By *anonymous*' : null;
    }
    const sub = build?.submittedBy;
    if (sub?.discordId) return sub.credited ? `${PREFIXES.submitted} <@${sub.discordId}>` : 'By *anonymous*';
    return null;
}

module.exports = { CREDIT_MAX, URL_MAX, PREFIXES, SHOWS, cleanCreditName, cleanCreditUrl, normalizeCredit, submissionCredit, creditLine };
