// utils/announcement.js
//
// One-time announcement delivery: the next time a user runs any top-level slash command, if there
// are any active (non-expired) announcements they haven't individually seen yet, ALL of them are
// delivered together as separate embeds inside ONE follow-up message -- never one message per
// announcement (Harkirat's explicit design: "one message but design it properly so it's easy to
// understand that they're different announcements"). That follow-up is ALWAYS ephemeral, regardless
// of whether the triggering command's own response was public -- announcements are a personal
// one-time notice, not something that should bloat a public channel.
//
// Wired into handlers/router.js's slash-command route engine -- called AFTER a command's own reply
// has already gone out, on both the modular-command and dynamic MP-loadout-fallback success paths.
// Deliberately NOT called from button/select/modal handlers (STEP 6.3+) -- only a fresh top-level
// command invocation counts, so re-clicking an existing panel or reactivating an idled one (see
// utils/passiveExpiry.js) can never re-trigger it; those routes never reach this function at all.
const Announcement = require('../models/Announcement');
const UserPreference = require('../models/UserPreference');

// Discord's hard cap on embeds in a single message. If a user somehow has more than this many
// unseen at once (hasn't run a command in a long time, or several were posted back-to-back), the
// OLDEST unseen ones are shown first and the rest wait for their next command rather than any of
// them being silently dropped -- `active`/`unseen` below are both sorted oldest-first.
const MAX_EMBEDS_PER_MESSAGE = 10;

// No expiry means indefinite. Explicit 60-day default is applied here (not as a schema default on
// Announcement itself) so there's exactly one place "what does blank mean" is decided.
const DEFAULT_EXPIRY_DAYS = 60;

// Parses the modal's "Expires In" field into a real Date (or null for "never"), or `undefined` if
// the input couldn't be understood at all -- callers must treat `undefined` as a validation error,
// not silently fall back to the default (that would let a typo silently mean something the admin
// didn't type).
function computeExpiresAt(rawInput) {
    const trimmed = (rawInput || '').trim().toLowerCase();
    if (trimmed === '') return new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    if (trimmed === 'never' || trimmed === 'none') return null;
    const days = Number(trimmed);
    if (!Number.isFinite(days) || days <= 0 || !Number.isInteger(days)) return undefined;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

// Same "days from now" framing on the way back out, used to prefill the Edit modal so resubmitting
// unchanged reproduces an equivalent expiry rather than silently resetting it to the 60-day default.
function expiryToInputValue(expiresAt) {
    if (!expiresAt) return 'never';
    const days = Math.max(1, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    return String(days);
}

async function getActiveAnnouncements() {
    const now = new Date();
    return Announcement.find({ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }).sort({ createdAt: 1 }).lean();
}

// Genuinely random per-announcement accent color, generated ONCE at creation time and stored on
// the doc (Announcement.color) -- 2026-08-13, superseding an earlier position-in-batch palette
// (Harkirat: "why don't you just make each new created announcement generate a unique accent
// color" instead of cycling a fixed set). NEVER regenerated on edit -- an edit is a correction to
// the SAME announcement, not a new one, so its color is part of its identity, not its render.
//
// Constrained HSL, not flat RGB random -- pure RGB randomness lands on muddy browns/greys roughly
// 1 in 3 rolls, and cranking saturation+lightness to their extremes produces neon/blown-out colors
// Harkirat explicitly ruled out ("not absurd like neon pink"). Hue is fully random (any color
// family is fair game); saturation and lightness are locked to bands that stay "clearly colorful"
// without either.
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

function buildAnnouncementEmbed(doc) {
    // No embed title at all (2026-08-13, Harkirat's direct correction: the generic "📢 Announcement"
    // header was still rendering above the text even after the custom-title INPUT field was removed
    // -- those are two different things, and removing the field alone didn't touch this). A custom
    // heading can just be typed into the text itself as markdown (e.g. "# My Title", exactly what
    // Harkirat's own test announcement did) -- separate announcements in one delivery are now told
    // apart by their per-announcement accent color alone, not by title text.
    // A REAL Discord timestamp tag, not the embed's own `timestamp` property (2026-08-13, Harkirat's
    // direct correction) -- that property renders as a STATIC "Today at 2:46 PM" in the embed
    // footer, formatted once at send time and never touched again, unlike every other timestamp in
    // this bot (`<t:UNIX:R>`, live/relative, matches the `/manage` list preview's own convention).
    const postedTs = Math.floor(new Date(doc.createdAt).getTime() / 1000);
    return {
        description: `${doc.text}\n\n-# Posted <t:${postedTs}:R>`,
        color: doc.color
    };
}

async function maybeSendAnnouncement(interaction) {
    const active = await getActiveAnnouncements();
    if (active.length === 0) return;

    const prefs = await UserPreference.findOne({ discordId: interaction.user.id }).select('seenAnnouncementIds');
    const seen = new Set((prefs?.seenAnnouncementIds || []).map(id => id.toString()));
    const unseen = active.filter(a => !seen.has(a._id.toString()));
    if (unseen.length === 0) return;

    const toShow = unseen.slice(0, MAX_EMBEDS_PER_MESSAGE);
    const embeds = toShow.map(doc => buildAnnouncementEmbed(doc));

    // Plain discord.js followUp with normal embed objects -- NOT a Components V2 payload, so this
    // doesn't need sendV2Payload's raw-REST bypass (a standard `embeds` array on followUp is fully
    // supported). Only requires the interaction to already be acknowledged, which every caller of
    // this function guarantees by calling it after the command's own reply completed.
    try {
        await interaction.followUp({ embeds, ephemeral: true });
    } catch (err) {
        // Interaction likely expired -- don't mark as seen, so it's retried on their next command
        // instead of silently lost.
        console.error('Failed to deliver announcement follow-up (interaction likely expired):', err?.message || err);
        return;
    }

    await UserPreference.findOneAndUpdate(
        { discordId: interaction.user.id },
        { $addToSet: { seenAnnouncementIds: { $each: toShow.map(a => a._id) } } },
        { upsert: true }
    );
}

module.exports = { getActiveAnnouncements, maybeSendAnnouncement, computeExpiresAt, expiryToInputValue, generateAccentColor };
