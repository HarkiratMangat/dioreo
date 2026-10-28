// utils/announcement.js
//
// One-time announcement delivery: the next time a user runs any top-level slash command, if there are any active (non-expired) announcements they haven't individually seen yet, ALL of them are delivered together as separate Components V2 Containers (classic embeds until 2026-10-26 23:44 EDT, Harkirat: "use components v2, even for simple embeds") inside ONE follow-up message -- never one message per announcement (Harkirat's explicit design: "one message but design it properly so it's easy to understand that they're different announcements"). That follow-up is ALWAYS ephemeral, regardless of whether the triggering command's own response was public -- announcements are a personal one-time notice, not something that should bloat a public channel.
//
// Wired into handlers/router.js's slash-command route engine -- called AFTER a command's own reply has already gone out, on both the modular-command and dynamic MP-loadout-fallback success paths. Deliberately NOT called from button/select/modal handlers (STEP 6.3+) -- only a fresh top-level command invocation counts, so re-clicking an existing panel or reactivating an idled one (see utils/passiveExpiry.js) can never re-trigger it; those routes never reach this function at all.
//
// A delivery that repeats an announcement carries one "Why am I seeing this?" button under the batch (every delivery did from 2026-10-26 15:20 EDT, announcement-controls, until whyRowNeeded below; handlers/announcementControls.js answers it), and a user who turned announcements off (UserPreference.announcementsOff, from that answer, /settings or /remind) gets none at all.
const Announcement = require('../models/Announcement');
const UserPreference = require('../models/UserPreference');

// At most this many announcements in one delivery. It was Discord's 10-embed cap; since the switch to Components V2 (2026-10-26 23:44 EDT) it is this bot's own limit, kept at 10 and kept under its old name because the portal's Broadcast route reads it. If a user somehow has more than this many unseen at once (hasn't run a command in a long time, or several were posted back-to-back), the OLDEST unseen ones are shown first and the rest wait for their next command rather than any of them being silently dropped -- `active`/`unseen` below are both sorted oldest-first.
const MAX_EMBEDS_PER_MESSAGE = 10;
// A Components V2 message holds at most 4,000 characters of text and 40 components, counted together across every Container in it. Past either, Discord refuses the whole follow-up, nothing is marked seen, and the same batch is retried and refused on every command, so no announcement reaches anyone (the embed version of this bug was found 2026-09-13, when the cap was 6,000 across embeds).
const TEXT_CHAR_BUDGET = 4000;
const COMPONENT_BUDGET = 40;
// One announcement's own text, so the first always fits with its Posted line beside it. core/ops/announcements.js refuses longer text, /manage's box stops at it, and buildAnnouncementContainer cuts anything older that is still longer.
const ANNOUNCEMENT_TEXT_MAX = 3900;

// The text and components a list of V2 components holds, counted the way Discord counts them.
function measureComponents(list) {
    let text = 0, count = 0;
    const walk = c => { count++; if (typeof c.content === 'string') text += c.content.length; (c.components || []).forEach(walk); if (c.accessory) walk(c.accessory); };
    list.forEach(walk);
    return { text, count };
}

// The longest run of due announcements, in order, whose Containers fit the message beside the Why row. The first one always goes (its text is capped at ANNOUNCEMENT_TEXT_MAX); the rest wait for the user's next command, which is how a batch over ten already works.
function fitEmbedBudget(docs) {
    const reserved = measureComponents([whyButtonRow()]);
    const out = [];
    let text = 0, count = reserved.count;
    for (const doc of docs) {
        const size = measureComponents([buildAnnouncementContainer(doc)]);
        if (out.length && (text + size.text > TEXT_CHAR_BUDGET || count + size.count > COMPONENT_BUDGET)) break;
        out.push(doc);
        text += size.text;
        count += size.count;
    }
    return out;
}

// No expiry means indefinite. Explicit 60-day default is applied here (not as a schema default on Announcement itself) so there's exactly one place "what does blank mean" is decided.
const DEFAULT_EXPIRY_DAYS = 60;

// Fixed minimum gap between two showings of the SAME repeating announcement to the SAME user (spec section 7) -- not configurable per announcement, only whether/how-many-times an announcement repeats at all is (Announcement.repeatCount).
const MIN_HOURS_BETWEEN_REPEATS = 24;

// Parses the modal's "Expires In" field into a real Date (or null for "never"), or `undefined` if the input couldn't be understood at all -- callers must treat `undefined` as a validation error, not silently fall back to the default (that would let a typo silently mean something the admin didn't type).
function computeExpiresAt(rawInput) {
    const trimmed = (rawInput || '').trim().toLowerCase();
    if (trimmed === '') return new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    if (trimmed === 'never' || trimmed === 'none') return null;
    const days = Number(trimmed);
    if (!Number.isFinite(days) || days <= 0 || !Number.isInteger(days)) return undefined;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

// Same "days from now" framing on the way back out, used to prefill the Edit modal so resubmitting unchanged reproduces an equivalent expiry rather than silently resetting it to the 60-day default.
function expiryToInputValue(expiresAt) {
    if (!expiresAt) return 'never';
    const days = Math.max(1, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    return String(days);
}

// A whole positive integer repeatCount means "repeat"; null/0/undefined/non-integer all mean the pre-existing one-time-only behaviour. Guards against a stray 0 or a negative value ever being read as "repeat forever" -- Number.isInteger(0) is true, so a bare truthy check on repeatCount alone would treat 0 as falsy correctly, but a negative integer would pass a truthy check and read as "repeat" when it should not.
function isRepeatingAnnouncement(announcement) {
    return Number.isInteger(announcement?.repeatCount) && announcement.repeatCount >= 1;
}

// The due-for-delivery decision, factored out of maybeSendAnnouncement() so it can be unit-tested against a fixed clock (scripts/announcementDelivery.test.js) without touching Mongo or a Discord interaction -- `now` is a plain millisecond timestamp, never `Date.now()` read internally, for exactly that reason.
//
// An announcement no one has ever been shown is always due (this is the pre-existing seen-once behaviour, unaffected by repeat). Once seen, a NON-repeating announcement is never due again -- also unchanged. A REPEATING announcement stays due until its per-user delivery count reaches repeatCount, and even then only once at least MIN_HOURS_BETWEEN_REPEATS have passed since the last showing -- a delivery row with no lastShownAt yet (seen once, but the repeat-tracking row hasn't been created) is treated as due immediately, since "no record of a last showing" cannot mean "shown 24h ago".
function isAnnouncementDue(announcement, seenIds, deliveryById, now) {
    const id = announcement._id.toString();
    if (!seenIds.has(id)) return true;
    if (!isRepeatingAnnouncement(announcement)) return false;
    const delivery = deliveryById.get(id);
    const count = delivery?.count || 0;
    if (count >= announcement.repeatCount) return false;
    const lastShownAt = delivery?.lastShownAt ? new Date(delivery.lastShownAt).getTime() : null;
    if (lastShownAt === null) return true;
    return (now - lastShownAt) >= MIN_HOURS_BETWEEN_REPEATS * 60 * 60 * 1000;
}

async function getActiveAnnouncements() {
    const now = new Date();
    // startsAt is schema-declared and already settable via core/ops/announcements.js's post/edit ops (added for the future portal's Broadcast realm) -- no live /manage modal field reaches it yet, but this read-side check has to exist NOW so a scheduled announcement doesn't show immediately the moment something does start setting it.
    return Announcement.find({
        $and: [
            { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
            { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] }
        ]
    }).sort({ createdAt: 1 }).lean();
}

// Genuinely random per-announcement accent color, generated ONCE at creation time and stored on the doc (Announcement.color) -- 2026-08-13, superseding an earlier position-in-batch palette (Harkirat: "why don't you just make each new created announcement generate a unique accent color" instead of cycling a fixed set). NEVER regenerated on edit -- an edit is a correction to the SAME announcement, not a new one, so its color is part of its identity, not its render.
//
// Constrained HSL, not flat RGB random -- pure RGB randomness lands on muddy browns/greys roughly 1 in 3 rolls, and cranking saturation+lightness to their extremes produces neon/blown-out colors Harkirat explicitly ruled out ("not absurd like neon pink"). Hue is fully random (any color family is fair game); saturation and lightness are locked to bands that stay "clearly colorful" without either.
function generateAccentColor() {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 55 + Math.random() * 20; // 55-75% -- colorful, short of neon
    const lightness = 45 + Math.random() * 15; // 45-60% -- readable as an embed accent strip, not pale or near-black
    return hslToHex(hue, saturation, lightness);
}

function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r, g, b;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const toByte = v => Math.round((v + m) * 255);
    return (toByte(r) << 16) | (toByte(g) << 8) | toByte(b);
}

// The text a user is shown, with the live Posted line under it. Shared by the Container below and /bot analytics' change panel, so the two never word it differently.
function announcementBody(doc) {
    const postedTs = Math.floor(new Date(doc.createdAt).getTime() / 1000);
    const text = String(doc.text || '');
    const body = text.length > ANNOUNCEMENT_TEXT_MAX ? `${text.slice(0, ANNOUNCEMENT_TEXT_MAX - 1)}…` : text;
    // A `{posted}` token in the text takes the live time where the writer put it (2026-10-27 10:44 EDT: the v3 launch footer reads "Made with … by @dior · {posted}"), and then no separate Posted line is added.
    if (body.includes('{posted}')) return body.split('{posted}').join(`<t:${postedTs}:R>`);
    return `${body}\n\n-# Posted <t:${postedTs}:R>`;
}

// One announcement as a Components V2 Container (2026-10-26 23:44 EDT, replacing the embed below as what is delivered). Its accent is the announcement's own colour. A line that is exactly `---` becomes a Separator with its divider line drawn; everything else stays text, blank lines included, so an announcement typed for the embed renders the same. The banner, when there is one, sits under the text as a Media Gallery, where the embed put its image.
function buildAnnouncementContainer(doc) {
    const components = [];
    let run = [];
    const flush = () => { const t = run.join('\n').trim(); if (t) components.push({ type: 10, content: t }); run = []; };
    for (const line of announcementBody(doc).split('\n')) {
        if (line.trim() === '---') { flush(); components.push({ type: 14, divider: true, spacing: 1 }); }
        else run.push(line);
    }
    flush();
    if (doc.bannerImageUrl) components.push({ type: 12, items: [{ media: { url: doc.bannerImageUrl } }] });
    return { type: 17, accent_color: doc.color, components };
}

// The classic embed, kept for the portal's tests and any reader of the old shape; nothing delivers it any more.
function buildAnnouncementEmbed(doc) {
    // No embed title at all (2026-08-13, Harkirat's direct correction: the generic "📢 Announcement" header was still rendering above the text even after the custom-title INPUT field was removed -- those are two different things, and removing the field alone didn't touch this). A custom heading can just be typed into the text itself as markdown (e.g. "# My Title", exactly what Harkirat's own test announcement did) -- separate announcements in one delivery are now told apart by their per-announcement accent color alone, not by title text. A REAL Discord timestamp tag, not the embed's own `timestamp` property (2026-08-13, Harkirat's direct correction) -- that property renders as a STATIC "Today at 2:46 PM" in the embed footer, formatted once at send time and never touched again, unlike every other timestamp in this bot (`<t:UNIX:R>`, live/relative, matches the `/manage` list preview's own convention).
    const postedTs = Math.floor(new Date(doc.createdAt).getTime() / 1000);
    const embed = {
        description: `${doc.text}\n\n-# Posted <t:${postedTs}:R>`,
        color: doc.color
    };
    // Optional banner image (added 2026-09-13 17:34 EDT) -- a plain Discord embed `image` renders full-width below the description, no different from any other embed image, and needs no Cloudinary re-hosting: Announcement.bannerImageUrl is already required to be a real https URL by core/ops/announcements.js's validatePost().
    if (doc.bannerImageUrl) embed.image = { url: doc.bannerImageUrl };
    return embed;
}

// The `ann_` ids handlers/announcementControls.js answers.
const ANN_WHY_ID = 'ann_why';
const ANN_OFF_ID = 'ann_off';
const ANN_ON_ID = 'ann_on';

// "Why am I seeing this?" under a delivered announcement (shown only on a repeat since whyRowNeeded below; Harkirat, 2026-10-26 15:20 EDT: "a button under the embed that basically like answers like, why am I seeing these messages? ... so if someone gets the announcement, they're not like just caught off guard"). One row under the whole batch, and never inside buildAnnouncementEmbed: /bot analytics renders that embed too, and must not grow a button.
function whyButtonRow() {
    const emojis = require('./emojiMap');
    return { type: 1, components: [{ type: 2, style: 2, label: 'Why am I seeing this?', custom_id: ANN_WHY_ID, emoji: emojis.parseEmoji(emojis.info) }] };
}

// The Why row goes under a delivery only when it repeats something (Harkirat, 2026-10-27 01:10 EDT: "only appears on any 2nd or following repetition of an announcement"): a first showing, including a one-off announcement's only showing, has no button. `seen` is the user's seenAnnouncementIds as strings, read before this delivery marks anything.
function whyRowNeeded(toShow, seen) {
    return toShow.some(a => seen.has(String(a._id)));
}

// The private answer to that button, with the switch beside it (mock-ups approved 2026-10-26 15:30 EDT with his colours: Turn off red with the DisableReminder bell, Turn back on blue). `state` is 'on' (the explanation), 'off' (just turned off) or 'back' (just turned back on).
function buildWhyPanel(state, client = null) {
    const emojis = require('./emojiMap');
    const settings = require('./commandMentions').mentionCommand(client, 'settings');
    const turnOff = { type: 2, style: 4, label: 'Turn off announcements', custom_id: ANN_OFF_ID, emoji: emojis.parseEmoji(emojis.disableReminder) };
    if (state === 'off') {
        return [{ type: 17, components: [
            { type: 10, content: `${emojis.checkmark} Announcements are off. Dioreo won't show them after your commands. Turn them back on any time in ${settings}.` },
            { type: 1, components: [{ type: 2, style: 1, label: 'Turn back on', custom_id: ANN_ON_ID, emoji: emojis.parseEmoji(emojis.announcements) }] },
        ] }];
    }
    if (state === 'back') {
        return [{ type: 17, components: [
            { type: 10, content: `${emojis.checkmark} Announcements are back on. Dioreo will show them after your commands again.` },
            { type: 1, components: [turnOff] },
        ] }];
    }
    // His copy and layout, 2026-10-27 01:23 EDT: no accent, the repeat note in its own box for a little space, a drawn divider above the settings line.
    return [{ type: 17, components: [
        { type: 10, content: `## ${emojis.info} Why am I seeing this?\nDioreo occasionally shares news for new features, big changes, or something important.` },
        { type: 10, content: '-# Some **important announcements** are shown multiple times, but only once per day.' },
        { type: 14, spacing: 1, divider: true },
        { type: 10, content: `-# Don't want Dioreo's announcements? Change your preferences anytime in ${settings}.` },
        { type: 1, components: [turnOff] },
    ] }];
}

// Every announcement running now, as the Containers a delivery builds (2026-10-28 16:40 EDT: shared by /help's Announcements button and `/help cmd:announcement`). Nothing is marked seen. With none running, one quiet line.
async function buildActiveAnnouncementComponents() {
    const active = await getActiveAnnouncements();
    const shown = fitEmbedBudget(active.slice(0, MAX_EMBEDS_PER_MESSAGE));
    return shown.length ? shown.map(a => buildAnnouncementContainer(a)) : [{ type: 17, components: [{ type: 10, content: '-# No announcements right now.' }] }];
}

// The one write of the setting, from the answer above, /settings and /remind alike: `true` while off, removed when turned back on (models/UserPreference.js announcementsOff).
async function setAnnouncementsOff(userId, off) {
    await UserPreference.updateOne({ discordId: userId }, off ? { $set: { announcementsOff: true } } : { $unset: { announcementsOff: 1 } }, { upsert: off });
}

async function maybeSendAnnouncement(interaction) {
    const active = await getActiveAnnouncements();
    if (active.length === 0) return;

    const prefs = await UserPreference.findOne({ discordId: interaction.user.id }).select('seenAnnouncementIds announcementDeliveries announcementsOff');
    // Turned off: nothing is shown and nothing is marked seen, so one that is still running shows once they turn announcements back on.
    if (prefs?.announcementsOff) return;
    const seen = new Set((prefs?.seenAnnouncementIds || []).map(id => id.toString()));
    const deliveryById = new Map((prefs?.announcementDeliveries || []).map(d => [d.announcementId.toString(), d]));
    const now = Date.now();
    // "unseen OR (unseen)" collapsed into one predicate -- isAnnouncementDue() covers both the pre-existing seen-once check AND the new repeat check, so a non-repeating announcement is due under EXACTLY the same condition it always was.
    const due = active.filter(a => isAnnouncementDue(a, seen, deliveryById, now));
    if (due.length === 0) return;

    const toShow = fitEmbedBudget(due.slice(0, MAX_EMBEDS_PER_MESSAGE));
    const containers = toShow.map(doc => buildAnnouncementContainer(doc));

    // A Components V2 follow-up (32768) that only the user sees (64), the way handlers/manage/* send theirs: one Container per announcement, the Why row under the batch. Only requires the interaction to already be acknowledged, which every caller of this function guarantees by calling it after the command's own reply completed.
    try {
        // No mention pings or highlights: an announcement may name someone (the launch footer names the developer) without lighting up their screen.
        await interaction.followUp({ flags: 32768 | 64, components: [...containers, ...(whyRowNeeded(toShow, seen) ? [whyButtonRow()] : [])], allowedMentions: { parse: [] } });
    } catch (err) {
        // Interaction likely expired -- don't mark as seen/delivered, so it's retried on their next command instead of silently lost. The real Discord code, so a refusal (50035, invalid form body) reads differently from an expired interaction (10062).
        console.error(`Failed to deliver announcement follow-up (Discord ${err?.code ?? 'no code'}):`, err?.message || err);
        return;
    }

    const nowDate = new Date(now);
    // seenAnnouncementIds keeps being written for EVERY delivered announcement, repeating included -- it is what makes "unseen" collapse to false after the first showing, at which point isAnnouncementDue() falls through to the repeat check for a repeating announcement instead of treating every later showing as a fresh "first ever" delivery.
    await UserPreference.findOneAndUpdate(
        { discordId: interaction.user.id },
        { $addToSet: { seenAnnouncementIds: { $each: toShow.map(a => a._id) } } },
        { upsert: true }
    );

    // Per-repeating-announcement counters. One announcement at a time, via the array-filter positional update -- $inc on an existing element if one exists, else $push a new one -- rather than a single blended query, because Mongo's positional `$` operator only ever addresses ONE matched array element per call and this can touch several different announcements' rows in the same delivery.
    for (const a of toShow) {
        if (!isRepeatingAnnouncement(a)) continue;
        const inc = await UserPreference.updateOne(
            { discordId: interaction.user.id, 'announcementDeliveries.announcementId': a._id },
            { $inc: { 'announcementDeliveries.$.count': 1 }, $set: { 'announcementDeliveries.$.lastShownAt': nowDate } }
        );
        if (inc.matchedCount === 0) {
            await UserPreference.updateOne(
                { discordId: interaction.user.id },
                { $push: { announcementDeliveries: { announcementId: a._id, count: 1, lastShownAt: nowDate } } }
            );
        }
    }
}

// buildAnnouncementEmbed exported 2026-08-23 11:27 EDT so /bot analytics' change-detail panel renders an announcement with the SAME text shape a user is shown, instead of re-describing its fields.
module.exports = { buildActiveAnnouncementComponents, ANN_WHY_ID, ANN_OFF_ID, ANN_ON_ID, whyButtonRow, whyRowNeeded, buildWhyPanel, setAnnouncementsOff, getActiveAnnouncements, maybeSendAnnouncement, computeExpiresAt, expiryToInputValue, generateAccentColor, buildAnnouncementEmbed, buildAnnouncementContainer, announcementBody, measureComponents, MAX_EMBEDS_PER_MESSAGE, TEXT_CHAR_BUDGET, COMPONENT_BUDGET, ANNOUNCEMENT_TEXT_MAX, fitEmbedBudget, isRepeatingAnnouncement, isAnnouncementDue, MIN_HOURS_BETWEEN_REPEATS };
