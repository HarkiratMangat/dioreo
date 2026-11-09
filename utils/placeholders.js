// utils/placeholders.js
//
// Harkirat's "No image yet" placeholders (2026-11-08 11:45 EST: "utilize them in the bot for where an image has to go but currently a custom one is not set"), uploaded to Cloudinary site_assets/ the same morning. A slot that is DESIGNED to hold a picture (a draw's thumbnail, a build's screenshot, a calendar page's banner, a season's patch-note images) shows one of these when nothing is set, instead of a text line or nothing. An optional picture (an announcement's banner, a profile image) never does.
//
// ⚠️ Permanent res.cloudinary.com URLs, never a Discord CDN link (those expire). Delivered with f_auto,q_auto like every other image.
const { withDeliveryDefaults } = require('./cloudinaryDeliveryUrl');

const BASE = 'https://res.cloudinary.com/dr6dn61eh/image/upload';
const PLACEHOLDER = {
    square: withDeliveryDefaults(`${BASE}/v1794156187/site_assets/placeholder-1x1.png`),     // thumbnails: draws, /today, /manage cards, build options
    wide: withDeliveryDefaults(`${BASE}/v1794156187/site_assets/placeholder-16x9.png`),      // galleries: a build's screenshot, a calendar banner, patch notes
    wide17x6: withDeliveryDefaults(`${BASE}/v1794156186/site_assets/placeholder-17x6.png`),  // uploaded for a future slot, unused today
    wide21x9: withDeliveryDefaults(`${BASE}/v1794156186/site_assets/placeholder-21x9.png`),  // uploaded for a future slot, unused today
};

// Whether a stored picture is one of these placeholders (2026-11-09 15:03 EST): a draw staged or indexed with the placeholder before its real picture exists (his "no pictures exist yet so use our placeholder images") still needs one, so Needs a Look and Check Draw Index say so.
const isPlaceholder = (url) => Boolean(url) && /\/site_assets\/placeholder-[^/]+\.png$/.test(String(url).split('?')[0]);

module.exports = { PLACEHOLDER, isPlaceholder };
