// utils/colorSwatchImage.js -- generates a small solid-color PNG for a single swatch entry in the "View Colors" panel (utils/colorPaletteView.js), so a listed hex actually SHOWS its color instead of just being typed text. No caching/hosting needed -- these are sent as message attachments (`files`) referenced via `attachment://` in the same payload, not hosted externally, so a fresh tiny PNG is generated per render rather than needing a Cloudinary round-trip like draws.js's thumbnail cache does for user-provided images.
const { Jimp } = require('jimp');

// A solid swatch is deterministic per hex and never changes -- but the View Colors panel regenerates up to 4 of them on EVERY render (every page/subpage switch re-encodes the exact same PNGs). Memoize by hex so each distinct color's PNG is encoded once per process instead of once per render, taking that redundant synchronous PNG encoding off the panel's hot path (2026-07-14 CPU pass). Bounded so a long-running process can't grow it without limit -- realistically only a few dozen distinct hexes ever appear across a user's sources, so this rarely evicts. The cached Buffer is only ever READ (uploaded as an attachment), never mutated, so sharing one reference across renders is safe.
const swatchCache = new Map();
const SWATCH_CACHE_MAX = 256;

async function renderSwatchImage(hex) {
    const key = hex & 0xffffff;
    const cached = swatchCache.get(key);
    if (cached) return cached;

    const rgba = (key << 8) | 0xff; // RRGGBB -> RRGGBBAA (fully opaque)
    const img = new Jimp({ width: 64, height: 64, color: rgba >>> 0 });
    const buffer = await img.getBuffer('image/png');

    if (swatchCache.size >= SWATCH_CACHE_MAX) swatchCache.delete(swatchCache.keys().next().value);
    swatchCache.set(key, buffer);
    return buffer;
}

module.exports = { renderSwatchImage };
