// portal/api/armory.js
//
// Armory realm \u2014 covers /manage's 'loadouts_mp' and 'loadouts_dmz' pages. No dates, so no Track \u2014 Rack (by category) and Coverage (data-quality flags) are both derived read-only views over the same Loadout collection. Mutations go through the generic changeset pathway (loadout.add, loadout.bulkReplace, etc.) built by the frontend.
const Loadout = require('../../models/Loadout');
const { findDuplicateLoadouts, getMpCategoryAccent, buildLoadoutCard, buildImageUrl } = require('../../utils/loadoutRender');
const { sendJson, forbidden, isObjectId } = require('./httpUtil');
const { grantedPagesFor } = require('./realmAccess');

const ARMORY_PAGES = ['loadouts_mp', 'loadouts_dmz'];
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// Coverage flags \u2014 every flag here is meant to be a filter into the Manifest (spec §8.2), so each build carries which ones it tripped rather than a single pass/fail.
function coverageFlags(build, mpBuilds) {
    const flags = [];
    if (!build.imageKey) flags.push('missing-image');
    // 🔴 "NO BADGES" IS NOT A DEFECT AND "EXACT ATTACHMENT COUNT" NEVER WAS ONE EITHER (2026-09-13 17:36 EDT, pins batch 2, pin pmtylf7gz, spec §6). A weapon with no Best/TopN badge simply hasn't been ranked yet -- that is a fact about the catalogue's coverage, not a fault on the build, and flagging it put a red mark on every unranked sibling of a ranked weapon for no reason a reader could act on. The exact-count check was worse: DMZ's own slot count VARIES with weapon rarity (models/Loadout.js/utils/loadoutRender.js never enforce exactly 9), so the exact-9 check flagged perfectly complete DMZ builds as broken, and MP's exact-5 called a build one optional slot short of full exactly as wrong as an empty one. The real defect either mode can have is a build that is NEARLY EMPTY -- 2 or fewer attachments -- which is a fact about the build regardless of mode.
    if ((build.attachments || []).length <= 2) flags.push('few-attachments');
    if (build.lastUpdated && Date.now() - new Date(build.lastUpdated).getTime() > NINETY_DAYS_MS) flags.push('stale-90d');
    // 🔴 AN MP BUILD WITH NO GUNSMITH CODE WAS UNFLAGGABLE. The eight checks covered image, badges, attachment count, staleness and near-duplicates, and none of them asked whether the code — the one field a player actually copies out of the bot — exists at all. Measured against the dev catalogue 2026-09-10 16:35 EDT: 10 of 133 builds have no shareCode, and 8 of those are DMZ, which HAS no code by design (see the build form's own note: "DMZ has no code — the card omits it"). The other 2 are MP, where it is a real gap, and the only way to find them was to scroll the tier board and notice.
    if (build.mode === 'MP' && !build.shareCode) flags.push('no-code');
    // 🔴 A CODE'S LENGTH IS ARITHMETIC AGAINST ITS OWN ATTACHMENT COUNT (2026-09-13 17:36 EDT, pins batch 2). Every real MP gunsmith code pairs exactly two characters per attachment slot -- checked against the dev catalogue before adopting this: LOCUS Build 1, five attachments, `2A4B5A8C9C` (10 chars); ICR-1, five, `2C4A5A8D9A` (10 chars). A code whose length disagrees with `2 * attachments.length` is truncated, padded, or pasted from a different build's clipboard entirely -- `correctGunsmithCode()` (utils/adminParser.js) fixes look-alike CHARACTERS, never a wrong LENGTH, so this is a defect nothing upstream already catches.
    if (build.mode === 'MP' && build.shareCode && build.shareCode.length !== (build.attachments || []).length * 2) flags.push('code-length-mismatch');
    if (build.mode === 'MP' && build.shareCode) {
        // 🔴 EXCLUDE THE BUILD FROM ITS OWN COMPARISON SET. `mpBuilds` is every MP build including this one — findDuplicateLoadouts's exact-code check trivially matches a build against itself (same shareCode, 100% attachment overlap), so every build with a shareCode and >=4 attachments always found at least one "duplicate": itself. That is what flagged 131 of 133 builds — measured against the real ported catalogue, not a design number.
        const others = mpBuilds.filter((b) => String(b._id) !== String(build._id));
        const dupes = findDuplicateLoadouts({ gunsmithCode: build.shareCode, attachments: build.attachments }, others);
        if (dupes && dupes.length > 0) flags.push('near-duplicate');
    }
    return flags;
}

function register(route) {
    const { requireAdmin } = require('../auth');

    route('GET', /^\/api\/armory$/, requireAdmin(async (req, res, url, session) => {
        const grantedPages = await grantedPagesFor(session.discordId, ARMORY_PAGES);
        if (grantedPages.length === 0) return forbidden(res, 'forbidden');
        const all = await Loadout.find({}).lean();
        const mpBuilds = all.filter(b => b.mode === 'MP');
        // 🔴 THE URL IS BUILT BY THE BOT'S OWN HELPER, NOT BY THE BROWSER. utils/loadoutRender.js's buildImageUrl is the one place that knows this convention — a bare key becomes a Cloudinary path with `f_auto,q_auto` baked in, and a value that is already a full URL passes through untouched (two LOCUS rows imported from imgur still rely on that). A client-side copy would hardcode the cloud name and would be the second place the transform convention lives, which is exactly what utils/cloudinaryDeliveryUrl.js was written to stop.
        const builds = all.map(b => ({
            ...b, coverage: coverageFlags(b, mpBuilds),
            // getMpCategoryAccent() returns a DECIMAL Discord-embed-color int (e.g. 16726876), because its other caller (buildLoadoutCard's preview, line ~54) feeds a Discord embed's `color` field, which wants exactly that shape. This response only ever reaches the frontend's CSS (`--c:${accent}` in armory.js), and a bare decimal there is invalid at computed-value time -- `background:var(--c)` silently resolves to nothing, which is why every category dot, weapon-card border and topic-chip dot rendered with zero color identity (Harkirat, pins pmtuwnt2v/pmtuwp8zi/pmtuws6zz/pmtuwwb7p, 2026-09-09). Convert to a hex string at this boundary, once, so the Discord-color contract at line 54 stays untouched.
            accent: `#${getMpCategoryAccent(b.category).toString(16).padStart(6, '0')}`,
            imageUrl: b.imageKey ? buildImageUrl(b.imageKey) : null,
        }));
        sendJson(res, 200, { builds, grantedPages });
    }));

    // The Armory compose UI's "LIVE PREVIEW" panel — calls the bot's own buildLoadoutCard() so the browser renders exactly what Discord will send (spec §4/§2 of the compose-UI design), rather than a second hand-built approximation of the card that could drift from the real one.
    route('GET', /^\/api\/armory\/preview$/, requireAdmin(async (req, res, url, session) => {
        const grantedPages = await grantedPagesFor(session.discordId, ARMORY_PAGES);
        if (grantedPages.length === 0) return forbidden(res, 'forbidden');
        const id = url.searchParams.get('id');
        if (id && !isObjectId(id)) return sendJson(res, 400, { error: 'not a valid build id' });
        const build = id && await Loadout.findById(id).lean();
        if (!build) return sendJson(res, 404, { error: 'no such loadout' });
        const card = buildLoadoutCard([build], 0, { color: getMpCategoryAccent(build.category), idPrefix: 'preview_' });
        sendJson(res, 200, { card });
    }));

    // Bulk "Export selection" — utils/adminParser.js's formatLoadoutsAsBulkText was only ever wired to Discord-side callers (handlers/manage/loadouts.js, utils/manageActions.js) before this.
    route('GET', /^\/api\/armory\/export$/, requireAdmin(async (req, res, url, session) => {
        const grantedPages = await grantedPagesFor(session.discordId, ARMORY_PAGES);
        if (grantedPages.length === 0) return forbidden(res, 'forbidden');
        // ⚠️ THREE SCOPES, ONE ROUTE, AND `ids` STAYS FIRST so the Manifest's existing "Export selection" keeps working unchanged. mode/category exist because the Bulk view exports what you are looking at rather than what you have ticked — ticking 133 rows to take a backup is the same defect as retyping them.
        const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean);
        const mode = url.searchParams.get('mode');
        const category = url.searchParams.get('category');
        let query;
        if (ids.length) query = { _id: { $in: ids } };
        else if (mode) query = { mode, ...(category ? { category: category.toUpperCase() } : {}) };
        else return sendJson(res, 400, { error: 'export needs ids, or a mode' });
        const builds = await Loadout.find(query).lean();
        const { formatLoadoutsAsBulkText } = require('../../utils/adminParser');
        sendJson(res, 200, { text: formatLoadoutsAsBulkText(builds), count: builds.length });
    }));
}

module.exports = { register, ARMORY_PAGES, coverageFlags };
