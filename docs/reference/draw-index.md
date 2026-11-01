---
kind: reference
status: live
---

# The draw image index

*Written 2026-11-01 01:05 EDT, with v3.4.1. Everything here was done by hand, one time, on Harkirat's go; no bot code reads any of it yet.*

## What exists

| Where | What |
|---|---|
| Cloudinary `draws/<slug>` | 93 draw images, each tagged and carrying context |
| Prod MongoDB `diors-builds`, collection `drawcatalogs` | 93 documents, one per image; no Mongoose model yet |
| `archive/draws/` | the old Alchemy Stars image, moved there when the draw was renamed |

## Cloudinary tags and context

Tags: `dioreo_draw`, `fp_<hash>`, `ptype_<price type key>`, `top_<mythic|legendary|epic>`, and `season_<n>_2026` on the new draws whose release season is known. Context keys: `title`, `price_type`, `fp`, `items` (the normalised keys the bot matches on), `items_full` (`rarity:kind:printed name`, joined by ` ; `), `source`, `indexed_on`, `release_season` and `aliases` where there are any. The bot's own reader (`readDrawContext` in `utils/cloudinaryCache.js`) only uses `title`, `price_type`, `fp` and `items`, so the extra keys cannot break it.

## The `drawcatalogs` fields

`slug` (unique by intent), `title`, `publicId`, `imageUrl`, `priceType`, `topTier`, `items[]` (`tier`, `kind` = weapon, character or vehicle, `name`, `baseName`, `skinName`), `fp`, `comments[]`, `aliases[]`, `tags[]`, `groupSlug` (equals `slug`, except the two Street Fighter Champion's documents which share one), `releaseSeason` (only for new draws with a known season; never guessed for returning draws), `source`, `indexedOn`. No indexes were created, so the model can declare its own without a name clash.

Item kind rules, in order: a base name in the loadout weapon catalogue is a weapon; a name already a character in another draw is a character; otherwise the draw type decides (the epic in a legendary-weapon draw is a character); Snowboard and Wingsuit are vehicles (Harkirat).

## How it was built

1. `scripts/indexDrawImages.js` read 98 images with Gemini 3.8 Flash on Vertex, three times (low thinking with six kinds, high thinking, high thinking with all 14 price types), then a Google Search check on the 38 rows the runs disagreed on. About $3.60 of Vertex in total; searches stayed inside the free 5,000 a month.
2. A review page (an Artifact) showed each image beside its proposed data; Harkirat confirmed or edited every row, and the answers were read back from its database.
3. `scripts/uploadDrawImages.js` uploaded 75 images (61 cropped by the 89px logo bar at the bottom of 1080×1350 images), then `enrichDrawMetadata.js` added the tags and context to all 87. Six Season 7 images supplied later were added the same way.
4. The documents were written through the Mongo connector and checked with a checksum computed inside the database: the same hash function in aggregation and in Node, 87 of 87 and then 6 of 6 identical.

## What to know before reusing any of it

- **The scripts need local files** under `local/project/features/draw-image-index/` (reads, manifests, the Season 7 list). They are a record, not a tool that runs on a fresh clone.
- **Reactive vs Non-Reactive cannot be read off a banner.** The model defaults to Reactive; every one of those 42 was a guess that Harkirat confirmed or corrected.
- **Rarity is only visible where the banner draws a frame.** Reads flip between runs where it does not.
- **Gemini's Google Search returns the queries but no source links** on Vertex, so a "confirmed by official sources" in its answer cannot be checked. It also ignores a search cap given in the prompt (15 searches an image on average against a cap of 6); a hard limit makes the call fail with `TOO_MANY_TOOL_CALLS`.
- **A list typed by hand into a database needs a checksum.** `insert-many` accepts whatever was typed; the aggregation hash is what proved nothing was mistyped.
- **In zsh `"$f[0]"` is an array subscript**, so `magick "$f[0]"` silently reads nothing; write `"${f}[0]"`.

## Open

See `docs/db-deferred-list.md`: the `DrawCatalog` model, sync and bot use, and the Advanced Character wording in `/draw prices`.
