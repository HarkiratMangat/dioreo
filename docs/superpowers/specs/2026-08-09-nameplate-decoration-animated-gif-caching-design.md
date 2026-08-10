---
kind: spec
status: frozen
---

# Animated nameplate/decoration GIFs + a persistent render-once cache — design

**Status:** DESIGN — nothing implemented. Filed instead of built because it surfaced as a side
investigation during the `feat/per-server-profile-colors` polish session and deserves its own
branch/session rather than getting bolted onto an already-finished, ship-blocked branch.
**Authored:** 2026-08-09 21:32 EDT (Sonnet 5)
**Subject:** `/colors` → View Colors panel's Nameplate and Deco pages (`utils/colorPaletteView.js`,
`utils/nameplateBedImage.js`, `utils/nameplatePalettes.js`).

## Where this came from

Harkirat asked, mid-session, whether the nameplate and decoration webm/APNG assets could be
converted to animated GIFs for the View Colors panel (currently both show as static poster frames).
A prior session (same day, earlier) had concluded the nameplate webm "genuinely has no alpha
channel" and treated that as a hard blocker. That conclusion turned out to be wrong, and re-deriving
it live is most of what this document reports.

## Finding 1 — the "no alpha channel" claim was a decoder-choice artifact, not a property of the asset

Verified live against Harkirat's real equipped nameplate (`twilight`, palette `cobalt`, asset path
`nameplates/nameplates/twilight/`, fetched fresh via `GET /users/{id}` with the collectibles field).

`ffprobe` on `nameplates/nameplates/twilight/asset.webm` shows `TAG:alpha_mode=1` and, per-packet,
a `Matroska BlockAdditional` side-data block (`block_additional_id=1`) — the WebM-standard alpha
channel mechanism. But `ffmpeg`'s **default** decode path for this file uses its native `vp9`
decoder, which silently **discards** that side-data block and hands back a `yuv420p` frame at
alpha=255 everywhere — indistinguishable from "no alpha," which is exactly what the prior session
measured and reported.

Forcing `-c:v libvpx-vp9` (rather than accepting ffmpeg's default decoder selection) decodes the
same file to `pixfmt:yuva420p`, and the alpha plane is real: 234 distinct values in a sample frame,
range 0–254, transparent at the edges, ~58/255 near center — a genuine soft gradient, not a flat
plane. **Lesson for whoever picks this up:** `ffmpeg -i x.webm ... -pix_fmt rgba out.png` is not
sufficient to prove or disprove alpha content in a VP9-in-WebM file; you must pin the decoder with
`-c:v libvpx-vp9` or ffmpeg's decoder-selection default will lie to you by omission.

## Finding 2 — GIF's binary alpha limitation is real and independently confirmed (not a measurement artifact)

Using the *correctly*-decoded frame (231 distinct alpha values after compositing with the current
production gradient-bed code, `utils/nameplateBedImage.js`), round-tripping through an actual GIF
encode (`gifski`) and back collapses the alpha channel to exactly **2** distinct values. So the
original "GIF can't hold this gradient" conclusion was correct on its own terms — it just had the
wrong root cause attached to it (attributed to a nonexistent alpha channel, when the real cause is
GIF's format-level 1-bit transparency).

This also affects decorations independently: an APNG→GIF conversion of a real equipped decoration
(no decoder bug involved there — APNG alpha decodes correctly everywhere) still visibly loses the
soft glow core of the effect, leaving only fully-opaque streaks. Confirmed against a real 288×288
decoration asset, ~0.13–0.16s CPU to convert.

## Finding 3 — Harkirat's proposed fix: flatten to a solid opaque background instead of a fading one

The gradient bed in `utils/nameplateBedImage.js` fades to alpha=0 at its edges (matching Discord's
own CSS gradient — see `NAMEPLATE_GRADIENT_STOPS`). That fade-to-transparent is *why* the composited
frame still needs an alpha channel at all, and therefore why GIF's binary threshold bites.

Harkirat's proposed fix: fill the **entire** canvas with a fully opaque solid color (no fade), then
composite the nameplate art's own semi-transparent regions on top as normal. Since compositing any
semi-transparent pixel over a fully opaque background always yields a fully opaque result, the
finished frame needs **no alpha channel at all** — there is nothing left for GIF to threshold.

Verified live: the solid-background composite came out at alpha 254–255 uniformly (fully opaque
within Jimp's compositing rounding). Round-tripped through `gifski` and diffed pixel-by-pixel
against the source PNG: mean per-channel-sum difference 4.8/765, max 31/765 — ordinary GIF
256-color palette quantization, not the alpha-threshold artifact. The solid-background GIF was also
smaller (435KB vs. 715KB for the gradient-fade version) since there's no alpha plane to encode.

Rounded corners were added on top (14px radius, 1px antialiased edge, applied as the last
compositing step) — the only remaining transparency in the frame is four small antialiased corner
triangles, which GIF's binary threshold handles fine at that scale (imperceptible).

**Tradeoff to flag, not yet decided:** this only visually matches Discord's own nameplate look if a
solid rounded rectangle is acceptable in the panel. The real Discord CSS gradient fades into
whatever's behind it; a solid block will read as a distinct rounded card instead. Harkirat confirmed
"that looks fine" for the sample shown, but that was one palette/one crop, not a final art-direction
sign-off — worth a quick visual check across a couple of palettes before treating this as settled.

## Finding 4 — measured, real, end-to-end timing (not modeled)

All numbers below are cold-cache, real network calls against Discord's CDN, run against Harkirat's
actual equipped nameplate on 2026-08-09.

| Path | Step | Time |
|---|---|---|
| **Current shipped** (static PNG + gradient bed, `renderNameplateWithBed`) | fetch + composite, cold | **202ms** |
| | same, warm (in-memory `bedCache` hit) | 0ms |
| **Hypothetical animated GIF pipeline** | webm fetch | 128ms |
| | alpha-aware frame extraction (`-c:v libvpx-vp9`, 43 frames @ 12fps) | 238ms |
| | composite each frame w/ solid rounded bed (Jimp, 43 frames) | 1,211ms |
| | GIF encode (`gifski`, 43 frames) | 344ms |
| | **total, cold** | **≈1,921ms** |

Delta vs. today: **+1.72s** on a cold render (≈9.5x). The compositing step (43 individual Jimp
read/write cycles) dominates, not the network fetch or the encode — if this needs to be cheaper, the
first lever is dropping to 6fps (roughly half the frames, roughly half the compositing cost; likely
visually indistinguishable for a slow gradient shimmer at this size).

Deco conversion (APNG→GIF, no per-frame compositing needed today since it's shown standalone, not
composited with a bed): ~0.12–0.16s CPU, one-shot.

## Finding 5 — the caching architecture question (Harkirat's proposal, confirmed sound)

Harkirat's framing: since nameplates and decorations are drawn from a finite Discord catalog and the
color palette is an 11-value enum (`utils/nameplatePalettes.js`'s `NAMEPLATE_PALETTES`), the
render-once cost above should be paid **once per unique (design, palette) combination that a real
user ever equips**, not once per request. Confirmed correct, with one correction to the premise:

- **This repo already has the exact persistent-cache pattern needed** — `utils/cloudinaryCache.js`,
  `utils/calendarBannerCache.js`, `utils/loadoutImageCache.js`, `utils/patchNotesCache.js` all follow
  the same shape: render once, upload to Cloudinary, reference by a deterministic public ID
  thereafter. This is not new architecture; it's applying an established convention to a new asset
  type.
- **What exists today (`bedCache` in `utils/nameplateBedImage.js`) is not "forever"** — it's an
  in-memory `Map` capped at `BED_CACHE_MAX = 64` entries with LRU eviction, wiped on every process
  restart/deploy. The 202ms baseline cost is already being re-paid more often than it needs to be,
  independent of anything about GIFs.
- **Precompute the whole catalog upfront is the wrong shape.** Discord adds new nameplate/decoration
  designs periodically, so the catalog isn't fixed forever, and most of any given catalog will never
  be equipped by an actual user of this bot. Lazy render-on-first-real-request + permanent Cloudinary
  persistence gets the same amortized-to-zero result without wasted upfront compute: first person to
  view any given (design, palette) pays the ~1.7s once; every later view — any user, any session, any
  bot restart — is a CDN URL fetch.
- **Suggested cache key:** something like `nameplate-gif/{slugified-design-path}-{palette-name}`,
  matching `cloudinaryCache.js`'s existing `slugify`/`publicIdFor` helpers rather than inventing a
  new ID scheme.

## Extending this to decorations — what transfers directly and what needs a decision

Harkirat asked to do "the same" for decorations. Checked against the actual code
(`utils/colorPaletteView.js`) before assuming: decorations are shown **standalone** in the View
Colors panel (`data.decorationUrl`, directly, not composited onto the user's avatar), same as
nameplates are shown standalone against their bed. This matters because it means the caching part
transfers cleanly — a decoration render is keyed by decoration design + nothing user-specific, same
as nameplates, not by the (effectively unbounded) set of user avatars.

What does **not** transfer automatically, and is an open design question rather than a decided plan:

- Decorations currently render with real transparency in the panel (no bed/background composited
  behind them), because the point is showing the decoration itself, not a decoration-on-a-card. The
  "flatten to solid opaque background" trick that fixed nameplate's GIF problem would *also* fix
  decoration's soft-glow-thresholds-to-nothing problem (Finding 2) for the same underlying reason —
  but it would mean giving every decoration preview a solid backing card, which is a visual design
  change nobody has signed off on. This needs Harkirat's call, not an assumed yes, before building it.
  Not tested this session — flagged as the natural next probe, since the technique is now proven for
  nameplates and would need the same kind of live verification (not just an assumption it'll behave
  the same) before treating it as settled for decorations.
- If solid-background decorations are rejected, decorations stay on the same lossy-glow tradeoff
  documented in Finding 2, but still benefit from the caching half of this proposal (compute the
  lossy GIF once, cache forever, rather than never doing it because it's "only" cheap-but-lossy per
  request).

## What a future session should actually do, in order

1. Get Harkirat's sign-off on the solid-rounded-background look across a couple of real
   palettes/nameplates (Finding 3's tradeoff) — don't assume the one sample already shown settles it
   for the whole catalog.
2. Decide the decoration background question (previous section) before building anything for decos.
3. Build a `nameplateGifCache.js` (or fold into `nameplateBedImage.js`) following the
   `cloudinaryCache.js` pattern: render → upload → deterministic public ID → serve from cache on
   every subsequent call, same shape as the other four existing Cloudinary caches.
4. Wire the alpha-aware extraction (`-c:v libvpx-vp9`, not ffmpeg's default) into whatever script
   does the actual conversion — this is the one correctness bug from today that must not regress.
5. Consider 6fps instead of 12fps for the compositing-cost win noted in Finding 4, but verify it's
   visually fine before committing to it (the "measure the renderer, don't model it" lesson applies
   here too — don't assume the frame-rate halving is imperceptible without actually looking at it).
6. Update `docs/legal/PRIVACY.md` if the new Cloudinary cache introduces any new stored
   field/behavior worth disclosing (same obligation every other cache utility already carries).

## Artifacts from this session's live verification

Saved to `local/` (gitignored, not durable beyond this machine) for reference, not as a deliverable:
`COMPARISON_real_gradient_vs_gif_threshold.png`, `COMPARISON_solid_bed_png_vs_gif.png`,
`fresh_frame0_libvpx.png`, `nameplate_correct.gif`, `nameplate_solid.gif`,
`nameplate_solid_rounded.gif`. The working test files (extracted frames, intermediate composites)
live in `/tmp/real_test/` on this machine and are not expected to survive — a future session should
re-derive them from the live Discord CDN rather than assume they still exist.

## Suggested effort tier for implementation

`[P2 · M · Sonnet5-Medium]` for steps 3–4 (the caching module + decoder fix — mechanical, the hard
research is already done and written down above). Steps 1–2 (the visual sign-off and the decoration
design question) aren't implementation work at all — they're a two-question check-in with Harkirat
before any of steps 3–6 start, and shouldn't be skipped or assumed just because the mechanics are
now well understood.
