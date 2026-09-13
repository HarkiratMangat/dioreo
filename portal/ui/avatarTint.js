// portal/ui/avatarTint.js — ESM. A soft three-colour mesh taken from a Discord avatar, shared by the Access Grant drawer's identity bar and the header's account menu.
//
// Moved out of access.js on 2026-09-13 17:49 EDT (batch-2 spec §8) so the profile menu can wear the same tint as the Edit drawer without importing a realm. The comment below is the original and still describes the Access bar it was written for; the menu uses the identical rule on `--raised` instead of `--sunk`.
import { useState, useEffect } from '../vendor/preact-hooks.mjs';

// 🔴 THE BAR TAKES ITS GROUND FROM THE FACE ON IT. Harkirat asked whether a soft mesh tint from the profile picture was doable, 2026-09-11 17:25 EDT -- it is, and it needs no server: Discord's CDN sends a permissive `Access-Control-Allow-Origin`, verified live against both a default avatar and a real user's before a line of this was written, so `crossOrigin="anonymous"` plus `getImageData` reads real pixels instead of tainting the canvas. The extraction is deliberately crude and deterministic: 28x28 samples, binned into 24 hue buckets of 15 degrees, with grey, near-black and near-white discarded so a dark avatar on a dark bar does not produce a tint of nothing. The three fullest buckets become three blobs. It is NOT the bot's k-means (utils/accentColor.js) and should not become it -- that runs server-side over a full-size image to pick ONE accent a user will live with, and this is three decorative blobs at 15% alpha that must cost nothing on a drawer open. ⚠️ EVERY FAILURE PATH ENDS IN NO TINT, NEVER A BROKEN BAR: a blocked image, a tainted canvas, an avatar with no colourful pixels at all. The bar's own `--sunk` is what shows, which is exactly what it looked like yesterday.
export function dominantColors(img, n = 3) {
    const S = 28;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, S, S);
    const d = x.getImageData(0, 0, S, S).data;
    const bins = new Map();
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (d[i + 3] < 200) continue;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b), chroma = mx - mn, lum = (mx + mn) / 2;
        if (chroma < 28 || lum < 26 || lum > 234) continue;
        let h = mx === r ? ((g - b) / chroma) % 6 : mx === g ? (b - r) / chroma + 2 : (r - g) / chroma + 4;
        h = (h * 60 + 360) % 360;
        const k = Math.floor(h / 15);
        const e = bins.get(k) || { n: 0, r: 0, g: 0, b: 0 };
        e.n += 1; e.r += r; e.g += g; e.b += b;
        bins.set(k, e);
    }
    return [...bins.values()].sort((p, q) => q.n - p.n).slice(0, n)
        .map((e) => `rgb(${Math.round(e.r / e.n)} ${Math.round(e.g / e.n)} ${Math.round(e.b / e.n)})`);
}

export function useAvatarTint(url) {
    const [tint, setTint] = useState(null);
    useEffect(() => {
        setTint(null);
        if (!url) return undefined;
        let dead = false;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            if (dead) return;
            try {
                const cols = dominantColors(img);
                if (cols.length) setTint(cols);
            } catch { /* a tainted canvas means no tint, and no tint is a perfectly good bar */ }
        };
        img.src = url;
        return () => { dead = true; };
    }, [url]);
    return tint;
}
