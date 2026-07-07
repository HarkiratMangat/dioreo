// utils/accentColor.js
const { getDominantColor } = require('./colorExtract');

// Per-command containers ship their own fixed brand color (Police Blue, Chinese Violet, etc. —
// see the palette in CLAUDE.md). This resolver lets a user override that on a per-preference
// basis via /settings' "Accent Color Style" option:
//   - 'preset'  : each command keeps its own preset color, EXCEPT /settings itself (which has no
//                 fixed brand color of its own) falls back to the user's avatar color instead.
//                 Callers signal this via `defaultBehavior: 'avatar'`. ("Pre-Designed Palette" in
//                 the /settings UI.) 'default' is the old value name for this same option, from
//                 before avatar-matching became the actual schema default — treated identically,
//                 so pre-existing saved docs don't silently change behavior.
//   - 'avatar'  : every container uses a color extracted from the user's avatar. This is now the
//                 real default (UserPreference.js's schema default), not 'preset' — Harkirat wanted
//                 avatar-matching to be what new users see everywhere, not just in /settings.
//   - 'banner'  : every container uses a color extracted from the user's banner. Falls back to
//                 avatar if the user has no banner set at all.
// Only the currently-needed source (avatar or banner) is fetched+extracted on any given call —
// both are cached independently on UserPreference so switching styles back and forth doesn't
// re-hit the Discord CDN/re-run pixel averaging unless the underlying image actually changed.
async function resolveAccentColor({ prefs, userFetch, presetHex, defaultBehavior = 'preset' }) {
    const rawStyle = prefs.accentColorStyle || 'avatar';
    const effectiveStyle = (rawStyle === 'default' || rawStyle === 'preset') ? defaultBehavior : rawStyle;

    if (effectiveStyle === 'preset') return presetHex;

    // "Banner" style with no banner uploaded has nothing to extract from — fall back to avatar.
    if (effectiveStyle === 'banner' && !userFetch.banner) {
        return getCachedColor(prefs, 'avatar', userFetch, presetHex);
    }

    return getCachedColor(prefs, effectiveStyle, userFetch, presetHex);
}

async function getCachedColor(prefs, kind, userFetch, fallbackHex) {
    const isAvatar = kind === 'avatar';
    const sourceHash = isAvatar ? (userFetch.avatar || 'default') : userFetch.banner;
    const hexField = isAvatar ? 'avatarColorHex' : 'bannerColorHex';
    const sourceField = isAvatar ? 'avatarColorSource' : 'bannerColorSource';

    if (prefs[hexField] != null && prefs[sourceField] === sourceHash) {
        return prefs[hexField];
    }

    const url = isAvatar
        ? userFetch.displayAvatarURL({ extension: 'png', size: 256 })
        : userFetch.bannerURL({ extension: 'png', size: 512 });

    let hex;
    try {
        hex = await getDominantColor(url);
    } catch (err) {
        console.error(`Accent color extraction failed for ${kind}, falling back to preset:`, err.message);
        return fallbackHex;
    }

    prefs[hexField] = hex;
    prefs[sourceField] = sourceHash;
    await prefs.save();
    return hex;
}

// Convenience wrapper for the preset-brand-color commands (calendar/draws/patchnotes/drawprices/
// seasonend). Avatar-matching is the real default now (see resolveAccentColor above), so most
// users DO need their avatar color resolved+cached here -- this only skips the Discord API fetch
// for the minority who've explicitly picked "Pre-Designed Palette" in /settings.
async function getAccentColorForCommand(interaction, prefs, presetHex) {
    const UserPreference = require('../models/UserPreference');

    // A user's very first interaction with the bot (any command, not just /settings) has no saved
    // prefs doc yet at all -- create one now so the accentColorStyle schema default ('avatar') can
    // actually be read AND its computed color cached. Without this, `prefs` would just be null and
    // the whole accent-color system would silently never engage until the user happened to run
    // /settings first (the only command that used to create this doc).
    if (!prefs) {
        prefs = new UserPreference({ discordId: interaction.user.id });
        await prefs.save();
    }

    if (prefs.accentColorStyle === 'default' || prefs.accentColorStyle === 'preset') {
        return presetHex;
    }
    const userFetch = await interaction.client.users.fetch(interaction.user.id, { force: true });
    return resolveAccentColor({ prefs, userFetch, presetHex, defaultBehavior: 'preset' });
}

module.exports = { resolveAccentColor, getAccentColorForCommand };
