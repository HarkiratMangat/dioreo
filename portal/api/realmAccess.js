// portal/api/realmAccess.js
//
// The "does this admin hold any page in realm X" predicate, computed once. Before this existed it was hand-written 4 separate times: season.js/armory.js/broadcast.js's own 403 checks, and auth.js's /auth/csrf nav-rail computation (code review Important #4, simplify Reuse #2 / Simplification #7 / Altitude #14-15) — broadcast.js's copy was even shaped slightly differently (`pages.includes(x)` instead of a filter), so a renamed or added page could silently desync the nav rail from the route's own gate.
const { getManagePages, isOwner, hasCommandAccess } = require('../../utils/adminAccess');

// Pages this admin holds that fall within `allowedPages`. getManagePages() already returns every page for the owner, so no separate owner check is needed here.
async function grantedPagesFor(discordId, allowedPages) {
    const pages = await getManagePages(discordId);
    return pages.filter((p) => allowedPages.includes(p));
}

// Which of the 5 realms this admin can even see. Access and Analytics aren't page-scoped (Access is owner-only; Analytics gates on the 'bot' command token), so they're resolved separately from the page-based realms.
async function visibleRealms(discordId, { SEASON_PAGES, ARMORY_PAGES, BROADCAST_PAGES }) {
    const owner = isOwner(discordId);
    const pages = await getManagePages(discordId);
    const realms = [];
    if (pages.some((p) => SEASON_PAGES.includes(p))) realms.push('season');
    if (pages.some((p) => ARMORY_PAGES.includes(p))) realms.push('armory');
    if (pages.some((p) => BROADCAST_PAGES.includes(p))) realms.push('broadcast');
    if (owner) realms.push('access');
    if (owner || (await hasCommandAccess(discordId, 'bot'))) realms.push('analytics');
    return realms;
}

module.exports = { grantedPagesFor, visibleRealms };
