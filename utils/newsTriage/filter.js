// utils/newsTriage/filter.js -- the free first pass over a post in a followed news channel (news-channel-triage, built 2026-11-04 20:02 EST). Pure: no discord.js, no database, no network, so scripts/newsTriage.test.js pins it.
//
// It decides only whether a post is worth the AI read (utils/newsTriage/model.js). Measured on 602 #leaks posts (2026-09-02 → 2026-11-04): about two-thirds name no draw, event, mode or patch at all (map previews, skins, links, trailers), and a tenth are for another region's version of the game. Those never cost a model call. Everything else is read, because whether a Global draw belongs to this season or the next, is new or returning, and is confirmed or only expected is a judgement words alone get wrong (Harkirat, 2026-11-04 19:28 EST: "that's exactly where the ai model's judgement comes into play").

// Leakers on Duty end posts with this line; /patch notes shows its own (utils/patchNoteSource.js drops it for the same reason). Left in, it reads as a rumour.
const DISCLAIMER = /(?:note that\s+)?(?:the\s+)?final\s+patch\s*notes?\s+(?:are|is)\s+subject\s+to\s+change\.?/gi;
// Words that tie a post to one regional version. "Global" or "all versions" anywhere in the post overrides them: "Global version will also get the … event" names CN too.
const REGION = /\b(CN|Garena|VNG|Korea|KR|Chinese|LATAM|MENA|Indian?|Japan(?:ese)?|Vietnam(?:ese)?)\b/i;
const GLOBAL = /\b(global|all (?:game )?versions|every version)\b/i;
// Something Dioreo tracks. A post with none of these is not read.
const SUBJECT = /\b(draws?|mythic drops?|series armou?ry|armou?ry|lucky draws?|crates?|events?|limited[- ]time modes?|playlists?|game ?modes?|modes?|tournaments?|buffs?|nerfs?|balance changes|adjustments?|patch ?notes?|seasons? \d+|next season|battle ?pass|returning|reset)\b/i;
// Shop deals and codes: Dioreo has no record for them.
const SHOP = /\b(bundles?|webstore|redemption codes?|store deals?|giveaways?|discount codes?)\b/i;
const DRAWISH = /\b(draws?|mythic drops?|armou?ry)\b/i;

// The post's words as Discord gives them, markdown and the disclaimer removed. Markdown is removed because chrono reads "November 27th__**" as no date at all (measured on the Botanist post, 2026-11-04). A Discord timestamp tag (<t:…>) becomes a date chrono can read.
function cleanText(text) {
    return String(text || '')
        .replace(DISCLAIMER, '')
        .replace(/<t:(\d+)(?::[tTdDfFR])?>/g, (_, s) => new Date(Number(s) * 1000).toUTCString())
        .replace(/[*_~`|]+/g, '')
        .replace(/^#{1,3}\s+/gm, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// The source of a post, a crosspost or a forward. A forward's own copy is blank and the snapshot holds the post (utils/patchNoteSource.js measured this, 2026-10-19).
function sourceOf(message) {
    return message?.messageSnapshots?.first?.() || message;
}

// The text of a post: its content plus any embed's title and description (a crossposted link post carries its words in the embed).
function postText(message) {
    const src = sourceOf(message);
    const parts = [src?.content || ''];
    for (const e of src?.embeds || []) parts.push(e?.title || '', e?.description || '');
    return cleanText(parts.filter(Boolean).join('\n'));
}

// The post's first line, for the skipped list. Held in memory until the daily list posts, never stored.
function titleOf(text) {
    const line = String(text || '').split('\n').find(l => l.trim()) || '';
    return line.trim().slice(0, 120);
}

// { read: true } when the post is worth a model call; otherwise { read: false, reason }. `hasImage`: a post with no words but a picture is read, because on #official-codm-news the picture can be the whole post (2026-11-04 22:09 EST). A banner strip costs one cheap read and returns nothing.
function prefilter(text, { hasImage = false } = {}) {
    const t = String(text || '').trim();
    if (!t) return hasImage ? { read: true } : { read: false, reason: 'no text' };
    if (/^\S+$/.test(t) && /^https?:\/\//i.test(t)) return { read: false, reason: 'a link only' };
    if (!SUBJECT.test(t)) return { read: false, reason: 'not a draw, event, mode or patch' };
    if (SHOP.test(t) && !DRAWISH.test(t)) return { read: false, reason: 'a shop deal' };
    if (REGION.test(t) && !GLOBAL.test(t)) return { read: false, reason: 'another region' };
    return { read: true };
}

// Whether the post's own words tie it to a regional version. resolve.js trusts the AI's "another region" only when they do: on 2026-11-04 the AI read "Grim Duo Draw will be coming tomorrow", whose text names no region, as another region's from its picture alone, and that would have dropped a Global draw in silence.
const namesRegion = text => REGION.test(String(text || '')) && !GLOBAL.test(String(text || ''));

module.exports = { cleanText, sourceOf, postText, titleOf, prefilter, namesRegion };
