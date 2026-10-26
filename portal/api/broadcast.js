// portal/api/broadcast.js
//
// Broadcast realm \u2014 covers /manage's 'announcement' page. Now showing is the live set exactly as Discord would render it (createdAt order \u2014 models/Announcement.js has no ordering field, see the spec's §8.2 note); Airtime puts every announcement on a time axis. Mutations go through the generic changeset pathway (announcement.post/edit/delete).
const Announcement = require('../../models/Announcement');
const { sendJson, forbidden } = require('./httpUtil');
const { grantedPagesFor } = require('./realmAccess');
const { MAX_EMBEDS_PER_MESSAGE } = require('../../utils/announcement');

const BROADCAST_PAGES = ['announcement'];

// 🔴 THE ONE PLACE AN ANNOUNCEMENT'S STATE IS DECIDED, and it has to agree with what Discord shows. utils/announcement.js's getActiveAnnouncements() already filters on BOTH expiresAt and startsAt -- its own comment says the startsAt check "has to exist NOW so a scheduled announcement doesn't show immediately the moment something does start setting it." This route only ever checked expiresAt, so the portal listed a not-yet-started announcement under "Now showing" while the bot correctly withheld it. Reproduced live 2026-08-23 with a real announcement dated three days out: it rendered as item 3 of the live set. The portal's whole claim about this panel is that it renders the live set exactly as Discord sends it, so a second, laxer definition of "live" is the bug.
//
// Computed server-side rather than in broadcast.js so the pill, the ordering and the Now-showing membership all read the same answer -- three client-side re-derivations is three chances to drift.
function announcementState(a, now) {
    if (a.expiresAt && new Date(a.expiresAt) <= now) return 'expired';
    if (a.startsAt && new Date(a.startsAt) > now) return 'scheduled';
    return 'live';
}

function register(route) {
    const { requireAdmin } = require('../auth');

    route('GET', /^\/api\/broadcast$/, requireAdmin(async (req, res, url, session) => {
        const grantedPages = await grantedPagesFor(session.discordId, BROADCAST_PAGES);
        if (grantedPages.length === 0) return forbidden(res, 'forbidden');
        const now = new Date();
        const rows = await Announcement.find({}).sort({ createdAt: 1 }).lean();
        const all = rows.map(a => ({ ...a, state: announcementState(a, now) }));
        const live = all.filter(a => a.state === 'live');
        // Discord's own per-message embed cap, read from the module that ENFORCES it (utils/announcement.js slices the unseen list by exactly this number). The portal shows which live announcements are past it and therefore waiting for the next message; a literal 10 here would be a second copy of a limit that only one of the two would ever notice changing.
        sendJson(res, 200, { live, all, maxPerMessage: MAX_EMBEDS_PER_MESSAGE });
    }));

    // 🔴 BROADCAST HAD NO EXPORT AND THE MOCKUP GIVES IT ONE -- and of the six realms, this is the one whose records are hardest to reconstruct if they go: an announcement's TEXT is the whole artifact, it is written once, and nothing else in the system stores a copy. ⚠️ Deliberately NOT re-importable, and the note in the strip says so: there is no bulk-add flow for announcements, so promising a round trip would be a false claim about what the file is for.
    route('GET', /^\/api\/broadcast\/export$/, requireAdmin(async (req, res, url, session) => {
        const grantedPages = await grantedPagesFor(session.discordId, BROADCAST_PAGES);
        if (grantedPages.length === 0) return forbidden(res, 'forbidden');
        const now = new Date();
        const rows = (await Announcement.find({}).sort({ createdAt: 1 }).lean())
            .map(a => ({ ...a, state: announcementState(a, now) }));
        const scope = url.searchParams.get('scope');
        if (scope !== 'live' && scope !== 'all') return sendJson(res, 400, { error: 'export needs one of: live, all' });
        const list = scope === 'live' ? rows.filter(a => a.state === 'live') : rows;
        const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '—');
        // One record per block, blank-line separated -- the same grammar every other export in this portal uses, so a person who has read one has read them all.
        const text = list.map(a => [
            `[${a.state}] posted ${day(a.createdAt)}`,
            `starts ${day(a.startsAt)}  ends ${a.expiresAt ? day(a.expiresAt) : 'never'}`,
            a.text,
        ].join('\n')).join('\n\n');
        sendJson(res, 200, { text, count: list.length });
    }));
}

module.exports = { register, BROADCAST_PAGES, announcementState };
