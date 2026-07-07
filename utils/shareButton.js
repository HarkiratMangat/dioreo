// utils/shareButton.js
//
// "Share Publicly" feature: any ephemeral response gets one extra button appended below its
// existing components (never mixed into an existing row, to avoid tripping the 5-buttons-per-row
// cap on commands whose nav row is already full). Clicking it doesn't touch the original ephemeral
// message at all -- it just posts a brand new, real public message with the same content. See
// index.js's `share_public` handler for the other half: Discord includes the FULL original message
// (content/embeds/components) directly in a button click's interaction payload, even when that
// message was ephemeral, so no state needs to be stored or reconstructed here.
const SHARE_BUTTON_CUSTOM_ID = 'share_public';

const SHARE_BUTTON_ROW = {
    type: 1,
    components: [
        { type: 2, style: 2, label: '🌐 Share Publicly', custom_id: SHARE_BUTTON_CUSTOM_ID }
    ]
};

// Appends the row to a top-level components array (the array passed to `components:` in a
// message payload, or returned by a command's buildContainer()) -- only when isEphemeral is true.
// A public message never needs a button offering to make it public.
function withShareButton(components, isEphemeral) {
    if (!isEphemeral) return components;
    return [...components, SHARE_BUTTON_ROW];
}

module.exports = { withShareButton, SHARE_BUTTON_CUSTOM_ID };
