// portal/api/broadcast.js
//
// Broadcast realm \u2014 covers /manage's 'announcement' page. Now showing is the live set exactly as
// Discord would render it (createdAt order \u2014 models/Announcement.js has no ordering field, see
// the spec's \u00a78.2 note); Airtime puts every announcement on a time axis. Mutations go through
// the generic changeset pathway (announcement.post/edit/delete).
const Announcement = require('../../models/Announcement');
const { getManagePages } = require('../../utils/adminAccess');

const BROADCAST_PAGES = ['announcement'];

function register(route) {
    const { requireAdmin } = require('../auth');

    route('GET', /^\/api\/broadcast$/, requireAdmin(async (req, res, url, session) => {
        const pages = await getManagePages(session.discordId);
        if (!pages.includes('announcement')) {
            res.writeHead(403, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ error: 'forbidden' }));
        }
        const now = new Date();
        const all = await Announcement.find({}).sort({ createdAt: 1 }).lean();
        const live = all.filter(a => !a.expiresAt || new Date(a.expiresAt) > now);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ live, all }));
    }));
}

module.exports = { register, BROADCAST_PAGES };
