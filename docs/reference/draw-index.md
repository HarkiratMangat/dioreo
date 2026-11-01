---
kind: reference
status: live
---

# The draw image index

*Written 2026-11-01 01:05 EDT, with v3.4.1, when everything here had been done by hand, one time, on Harkirat's go. Since v3.5.0 (2026-11-01) the bot reads and keeps the catalog: see "How the bot uses it" below.*

## What exists

| Where | What |
|---|---|
| Cloudinary `draws/<slug>` | 93 draw images, each tagged and carrying context |
| Prod MongoDB `diors-builds`, collection `drawcatalogs` | 93 documents, one per image; model `models/DrawCatalog.js` since v3.5.0 |
| `archive/draws/` | the old Alchemy Stars image, moved there when the draw was renamed |

## Cloudinary tags and context

Tags: `dioreo_draw`, `fp_<hash>`, `ptype_<price type key>`, `top_<mythic|legendary|epic>`, and `season_<n>_2026` on the new draws whose release season is known. Context keys: `title`, `price_type`, `fp`, `items` (the normalised keys the bot matches on), `items_full` (`rarity:kind:printed name`, joined by ` ; `), `source`, `indexed_on`, `release_season` and `aliases` where there are any. The bot's own reader (`readDrawContext` in `utils/cloudinaryCache.js`) only uses `title`, `price_type`, `fp` and `items`, so the extra keys cannot break it.

## The `drawcatalogs` fields

`slug` (unique; the model declares the index), `title`, `publicId`, `imageUrl`, `priceType`, `topTier`, `items[]` (`tier`, `kind` = weapon, character or vehicle, `name`, `baseName`, `skinName`), `fp`, `comments[]`, `aliases[]`, `tags[]`, `groupSlug` (equals `slug`, except the two Street Fighter Champion's documents which share one), `releaseSeason` (only for new draws with a known season; never guessed for returning draws), `source`, `indexedOn`. No indexes were created by hand; `models/DrawCatalog.js` declares `slug` unique plus `fp` and `groupSlug`, and Mongoose builds them the first time the bot starts with the model (on prod, the first deploy of v3.5.0). Checked before: 93 documents, 93 distinct slugs.

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

## How the bot uses it (v3.5.0, 2026-11-01)

**Reading.** `utils/drawCatalog.js` loads the whole catalog into memory (it is about 100 KB) and keeps it for ten minutes. When a draw is saved with no image, `resolveThumbnail` in `utils/cloudinaryCache.js` asks the catalog at each step before Cloudinary:

| Step | Catalog | Then Cloudinary, as before |
|---|---|---|
| 1 | its own title, then **another name it ran under** (`aliases`; new, Cloudinary cannot do it) | `draws/<slug>` |
| 2 | the same items at the same rarities; of the Street Fighter pair, the group's own document | `fp_<fingerprint>` tag |
| 3 | a title or other name within 0.75 similarity | listing every image |

A hit in the catalog costs no Cloudinary call (measured on a local copy: 1 to 11 ms, against about 400 ms for one Admin API lookup). A draw the catalog does not hold falls through to Cloudinary unchanged, so an empty catalog, the dev bot's local database, or a failed read changes nothing.

**Draw type.** When the catalog knows a draw for certain (its title, another name, or its items; never a near-miss) and the admin left Draw Type blank or picked Unsure, the save takes the catalog's type and says so: a note on the single Add, a "draw type from the draw index" section on Add or Replace Multiple. An Undo replays stored draws and never takes a type. Edit never changes the type on its own.

**Writing.** When the bot uploads a draw image, or re-tags one it reused by title because the items changed, it updates that document (`recordCatalogImage`): image URL, items, fingerprint, top tier, tags, and the type when one is named. Items are merged, so a hand-written `kind`, `baseName` or `skinName` survives a retype. A new image creates a document, with `kind` left blank where no other draw says what the item is. `comments`, `aliases`, `groupSlug` and `title` are never written on a document that exists. The dev bot cannot write to Cloudinary, so it never writes the catalog either.

**Syncing.** `scripts/syncDrawCatalog.js` compares the catalog with Cloudinary's tagged `draws/` images. A dry run unless `--write`; Cloudinary is only read. It adds a document for any image the catalog lacks (items from `items_full`, or from the live draw of the same title for an image the bot uploaded) and updates only the fields Cloudinary owns; differences in the hand-curated fields are printed and left. Checked 2026-11-01: run against an empty local database it rebuilt all 93 documents, and every one matched prod's except the three hand-curated differences (the Street Fighter `groupSlug`, and the two `*aka*` comments). A second run found nothing to do.

```
MONGODB_URI=<uri> node scripts/syncDrawCatalog.js            # dry run
MONGODB_URI=<uri> node scripts/syncDrawCatalog.js --write
```

## Open

- The Advanced Character wording in `/draw prices` (`docs/db-deferred-list.md`).
- Items the bot adds have no `kind` until someone says; the sync prints nothing for that, so a blank `kind` is the marker.
