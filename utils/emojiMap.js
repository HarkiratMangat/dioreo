// utils/emojiMap.js

const fs = require('fs');
const path = require('path');

// Buttons have a dedicated `emoji` field ({ id, name, animated }) — unlike Text Displays, a
// button's `label` is plain text only, so pasting a raw "<a:Name:123>" mention string into label
// just shows that literal text instead of rendering the emoji. This parses the mention strings
// above into the object shape ButtonBuilder/the raw API expects.
function parseEmoji(mention) {
    const match = mention.match(/^<(a)?:(\w+):(\d+)>$/);
    if (!match) return undefined;
    return { animated: !!match[1], name: match[2], id: match[3] };
}

// Every mention string below is written with the PRODUCTION app's emoji ids, which stay the
// literal source of truth in git. They are also the fallback if the sync below can't run.
const emojis = {
    // /settings' "Made with love by @dior" footer -- replaced dioreo with diorHeart (2026-07-12,
    // same day, Harkirat's follow-up correction). Animated this time (a: prefix).
    diorHeart: '<a:diorHeart:1525941004929339594>',
    mythic: '<:7Mythic_CODM:1523190107614744757>',
    legendary: '<:5Legendary_CODM:1523190105152688158>',
    legacy: '<:6Legacy_CODM:1523190105739886663>',
    epic: '<:4Epic_CODM:1523190104489857054>',
    bp: '<:BP_CODM:1523190108386365470>',
    // 2nd Battle Pass icon -- a DIFFERENT emoji from `bp` above, not a duplicate. Was hardcoded inline
    // in seasonend.js, which meant refreshEmojiIds() never saw it and it stayed broken on the dev bot
    // (found 2026-07-26 15:52 EDT). Every emoji must live here to be sync-able.
    bp1: '<:BP_CODM1:1523190109065707560>',
    rank: '<:Rank_7Legendary_CODM:1523190127025717360>',
    dmz: '<:DMZ_CODM:1523190115319549963>',
    cp: '<:CP_CODM:1523190109753839637>',
    // Distinct from `cp` above -- the draw-prices redesign (drawPrices_ui.json) uses this second CP
    // icon specifically for the quote-block total line; `cp` is left alone since nothing else was
    // asked to switch over to the new icon.
    cp2: '<:CP_CODM2:1523190111460786318>',
    // Animated icon for the draw-prices region-toggle button (drawPrices_ui.json) -- lives in the
    // button's `emoji` field, not its `label` (see Components V2 point 4 in CLAUDE.md). Superseded
    // as the 3-way region switcher's per-button icon 2026-08-07 15:45 EDT by the three region-specific
    // emoji below (Harkirat provided them via diors-notes.md); kept defined since nothing else references it.
    regions: '<a:Regions:1525705441072382052>',
    // Per-region icons for the 3-way region-switch button row (drawprices.js's buildContainer),
    // added 2026-08-07 15:45 EDT from Harkirat's diors-notes.md request -- one distinct icon per CP
    // tier instead of the single generic `regions` icon shared across all three buttons.
    region10Cp: '<a:10CpRegion:1535356505614852237>',
    region20Cp: '<a:20CpRegion:1535357376369139752>',
    region30Cp: '<a:30CpRegion:1535357851352965240>',
    // Added for the command heading redesign (calendar/draws/patchnotes/settings)
    // /manage panel redesign (2026-07-12, per the 4 mockup JSONs in Downloads) -- these are the
    // panel's own header/action icons, distinct from the public-command-header set above.
    database: '<a:Database:1524967327437815899>',
    mngAdd: '<a:Add:1525262938288558200>',
    mngEdit: '<a:Edit:1525262950313623772>',
    mngDelete: '<a:Delete:1525262947532931163>',
    mngBulkAdd: '<a:BulkAdd:1525328428201414761>',
    mngBulkReplace: '<a:BulkReplace:1525262944815022170>',
    mngBulkDelete: '<a:BulkDelete:1525262942906482880>',
    mngExport: '<a:Export:1525262952540934264>',
    mngPurge: '<a:Purge:1525327754013442129>',
    mngInfo: '<a:Info:1525337539085340722>',
    mngUrls: '<a:URLs:1525337321568997449>',
    calendar: '<a:Calendar:1523762208050385107>',
    newDraws: '<a:NewDraws:1523837409211453613>',
    returningDraws: '<a:ReturningDraws:1523838126596817016>',
    patchNotes: '<a:PatchNotes:1523762216954888286>',
    settings: '<a:Settings:1523762203537309696>',
    timestamp: '<a:Timestamps:1523762211103969420>',
    drawPrices: '<a:DrawPrices:1525864071776305163>',
    b1: '<:b1:1523852972835082371>',
    // Shared pagination arrows (utils/paginationRow.js) — used by every command with a Prev/Next
    // page row, not just one specific command's list.
    left: '<:Left:1523864238836154449>',
    right: '<:Right:1523864237972127775>',
    // Loadout "badges" (utils/loadoutRender.js) — Meta/Best-in-category/Top-N-in-category flags
    // shown under the weapon name. `best` and `top` are two DISTINCT emojis (Best-in-category vs.
    // Top-N-in-category are different tiers, see buildBadgesLine()) — don't reuse one for the
    // other. `blank` is a zero-width spacer emoji used to separate two badges on one line without a
    // visible bullet/divider character.
    meta: '<a:Meta:1524259849745989723>',
    best: '<a:Best:1524235235070312488>',
    top: '<a:Top:1524183479997169714>',
    toxic: '<a:Toxic:1524535298380402859>',
    blank: '<:blank:1524243739206352906>',
    // "View Colors" button in /settings (utils/colorPaletteView.js, index.js's colors_view/
    // colors_page_ handlers) -- blurple-recolored, background-removed eyedropper icon, per
    // Harkirat's own design pass (2026-07-13). Uploaded by Harkirat directly, not via this bot.
    eyedropper: '<a:Eyedropper:1526293991166054541>',
    // "Show Everyone" button (utils/shareButton.js, formerly the plain 🌐 globe, 2026-07-14) --
    // Harkirat-provided icon, lives in the button's `emoji` field via parseEmoji(), not baked into
    // `label` (see Components V2 point 4 above).
    share: '<a:Share:1526666464625430558>',
    // Patch notes "additional info" aliasing (2026-07-30 22:24 EDT) -- typing a standalone `b:`/`n:`
    // token in the additional-info text gets swapped for these at render time (patchnotes.js's
    // applyInfoAliases()). Harkirat-uploaded, not animated.
    buff: '<:Buff:1532771212172984401>',
    nerf: '<:Nerf:1532771213271892089>',
    // Section heading icons for the 3-section calendar redesign's Events/Playlists pages
    // (2026-07-31 14:00 EDT) -- Draws reuses the existing newDraws/returningDraws emojis above.
    events: '<a:Events:1532830530108653659>',
    modes: '<a:Modes:1532809521305489610>',
    // /manage's Bulk Format Guide headings (added 2026-07-31 17:20 EDT) -- both the rich guide
    // panel's own top header (utils/manageGuides.js) and every page's "Guide" section heading text.
    guide: '<a:Guide:1532894836301238477>',
};

const DEV_OVERRIDE_FILE = path.join(__dirname, 'emojiMap.dev.json');

/**
 * Re-points every mention string above at the ids owned by the app we actually booted as, matching
 * on emoji NAME.
 *
 * Why this exists: these are Discord APPLICATION emojis, and an application emoji only renders for
 * the app that owns it. The dev bot (a separate Discord application) has its own copies of all 72
 * emojis under identical names but DIFFERENT ids, so the hardcoded prod ids above render as broken
 * text there. Matching on name means one codebase serves both apps with no per-environment config,
 * and it self-heals if an emoji is ever deleted and re-uploaded (which mints a new id).
 *
 * On prod this is a no-op that rewrites nothing — the ids already match. Deliberately fail-soft:
 * any error leaves the hardcoded prod ids in place rather than taking the bot down over cosmetics.
 *
 * Mutates the exported object IN PLACE on purpose. Every consumer reads `emojis.foo` at render
 * time (per interaction), not at require time, so in-place rewriting reaches all of them without a
 * single call-site change.
 *
 * @param {import('discord.js').Client} client a logged-in client
 * @returns {Promise<{synced: number, missing: string[], overridden: number}>}
 */
async function refreshEmojiIds(client) {
    const result = { synced: 0, missing: [], overridden: 0 };
    const appId = client.application?.id ?? client.user?.id;

    try {
        // Raw route string rather than `Routes.applicationEmojis(...)` -- the helper's availability
        // varies across discord.js minors, the endpoint itself doesn't.
        const res = await client.rest.get(`/applications/${appId}/emojis`);
        const live = res?.items ?? res ?? [];
        const byName = new Map(live.map(e => [e.name, e]));

        for (const [key, value] of Object.entries(emojis)) {
            if (typeof value !== 'string') continue;
            const parsed = parseEmoji(value);
            if (!parsed) continue;
            const match = byName.get(parsed.name);
            if (!match) { result.missing.push(`${key} (:${parsed.name}:)`); continue; }
            const next = `<${match.animated ? 'a' : ''}:${match.name}:${match.id}>`;
            if (next !== value) { emojis[key] = next; result.synced++; }
        }
    } catch (err) {
        console.error('⚠️  Emoji id sync skipped, keeping hardcoded ids:', err?.message || err);
        return result;
    }

    // Dev-only overlay, applied AFTER the name sync so it wins. Lets a dev-bot session point
    // individual keys at throwaway test emojis that don't exist on prod at all, without editing
    // (and risking committing) the tracked map above. Gitignored; absent in normal operation.
    if (process.env.NODE_ENV === 'development') {
        try {
            if (fs.existsSync(DEV_OVERRIDE_FILE)) {
                const overrides = JSON.parse(fs.readFileSync(DEV_OVERRIDE_FILE, 'utf8'));
                for (const [key, mention] of Object.entries(overrides)) {
                    if (typeof mention !== 'string' || !parseEmoji(mention)) {
                        console.warn(`⚠️  emojiMap.dev.json: "${key}" is not a valid emoji mention, ignored`);
                        continue;
                    }
                    emojis[key] = mention;
                    result.overridden++;
                }
            }
        } catch (err) {
            console.error('⚠️  emojiMap.dev.json could not be read, ignoring it:', err?.message || err);
        }
    }

    return result;
}

emojis.parseEmoji = parseEmoji;
emojis.refreshEmojiIds = refreshEmojiIds;

module.exports = emojis;