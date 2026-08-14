// utils/shareButton.js
//
// "Share Publicly" feature: any ephemeral response gets one extra button appended below its
// existing components (never mixed into an existing row, to avoid tripping the 5-buttons-per-row
// cap on commands whose nav row is already full). Clicking it doesn't touch the original ephemeral
// message at all -- it just posts a brand new, real public message with the same content. See
// handlers/share.js's `share_public` handler for the other half: Discord includes the FULL original message
// (content/embeds/components) directly in a button click's interaction payload, even when that
// message was ephemeral, so no state needs to be stored or reconstructed here.
const emojis = require('./emojiMap');

const SHARE_BUTTON_CUSTOM_ID = 'share_public';

// Reworded 2026-07-14 (Harkirat's request, "Share Publicly" read as ambiguous about what actually
// happens) -- "Show Everyone" states the outcome directly. Emoji switched from the plain 🌐 globe
// to Harkirat's own custom icon the same day -- goes through the button's dedicated `emoji` field
// via parseEmoji(), NOT baked into `label` (a button's label is plain text only; see the Components
// V2 lessons in CLAUDE.md -- pasting a raw mention string into label just shows it as literal text).
// Built per call, NOT a module-level const: refreshEmojiIds() rewrites emojiMap at boot, after this
// file is require()d, so a const here froze the pre-sync PROD id and the button rendered with a broken
// emoji on the dev bot (found 2026-07-26 16:04 EDT by scripts/checkEmojiCaptures.js, not by eye).
function shareButtonRow() {
    return {
        type: 1,
        components: [
            { type: 2, style: 2, label: 'Show Everyone', custom_id: SHARE_BUTTON_CUSTOM_ID, emoji: emojis.parseEmoji(emojis.share) }
        ]
    };
}

// Appends the row to a top-level components array (the array passed to `components:` in a
// message payload, or returned by a command's buildContainer()) -- only when isEphemeral is true.
// A public message never needs a button offering to make it public.
//
// ⚠️ Under the v3 server-admin visibility policy (2026-08-10 15:50 EDT, utils/guildPolicy.js) this
// row is STRIPPED again on the way out, inside utils/sendV2Payload.js, when the server has forced
// the response ephemeral -- the button posts a brand new, genuinely public message, so leaving it
// live would be a one-click bypass of the rule. That strip lives at the send boundary rather than
// here because every caller of this function already routes through it, and a `guildPolicy`
// argument here would be eight more call sites that have to remember to pass it. handlers/share.js's
// share_public handler re-checks server-side too: a panel opened BEFORE an admin set the rule still
// has the button sitting on it.
function withShareButton(components, isEphemeral) {
    if (!isEphemeral) return components;
    return [...components, shareButtonRow()];
}

module.exports = { withShareButton, SHARE_BUTTON_CUSTOM_ID };
