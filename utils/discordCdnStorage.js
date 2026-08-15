// utils/discordCdnStorage.js -- posts a rendered animated-preview file ONCE to a dedicated, permanent
// storage channel (Harkirat's "dioreoland" server, added 2026-08-10 12:08 EDT specifically for this),
// capturing the resulting cdn.discordapp.com attachment url so future renders can reference it
// directly instead of re-fetching+re-attaching on every single view.
//
// WHY this exists at all (the full investigation is recorded in utils/nameplateWebpCache.js's/
// utils/decorationWebpCache.js's own headers and in linksee memory): a Components V2 media-gallery
// item referencing an EXTERNAL url (Cloudinary or otherwise) gets proxied through Discord's own
// images-ext-N.discordapp.net and RE-ENCODED to lossy before any client sees it -- confirmed live, and
// confirmed NOT fixable via a query-string hint (breaks the reference entirely) or by using GIF
// instead of WebP (also gets reprocessed, not byte-identical). The ONLY confirmed-working bypass is
// referencing Discord's OWN cdn.discordapp.com domain, which is never proxied. A signed attachment
// url's `ex`/`is`/`hm` params DO expire, but per Discord's own docs (developers/reference.mdx,
// "Signed Attachment CDN URLs"), passing a stale one back into an API field (exactly what this does)
// gets it auto-refreshed by Discord server-side -- so no expiry-tracking/refresh logic is needed here.
//
// This is a genuinely DIFFERENT capability from everything else this bot does: CLAUDE.md's hard
// invariant is that this bot has ZERO standing guild permissions and only ever acts through an
// interaction-response webhook, never a raw proactive channel post (that fails 50001 Missing Access
// everywhere else). This module's target channels are the one deliberate exception -- Harkirat invited
// the bot to that specific server with real channel permissions for exactly this purpose. Never reuse
// this pattern to post anywhere else without the same explicit setup.
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

let restClient = null;
function getRest() {
    if (!restClient) restClient = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    return restClient;
}

// Returns the resulting cdn.discordapp.com attachment url, or null on ANY failure (channel not
// configured, missing access, network error) -- never throws. Callers treat null exactly like "no
// Discord CDN url available yet", falling back to the Cloudinary-url-based fetch+reattach path, same
// non-blocking philosophy as every other step in this pipeline.
//
// `components`: a full Components V2 component array (Container/TextDisplay/MediaGallery/etc, same
// shape every other UI surface in this bot uses -- see utils/colorPaletteView.js for the convention),
// built by the caller with its own metadata (asset id, sku_id, palette/design name if available,
// Cloudinary public_id, dimensions, frame count, file size, render time, timestamp). Harkirat's
// explicit request (2026-08-10 12:09 EDT, refined 13:01 EDT into a proper Components V2 design rather
// than plain text): this channel doubles as a searchable log AND a real per-entry visual record, so
// every upload carries structured, labeled TextDisplay content -- Discord's message search indexes
// component text content the same as plain message content, so nothing is lost by using components
// here instead of a bare content string.
// Recursively walks a returned Components V2 tree looking for the first Unfurled Media Item that
// resolved to a real cdn.discordapp.com url. REQUIRED because Discord does NOT populate the classic
// top-level `message.attachments` array for a file referenced only via `attachment://filename` inside
// a component (Media Gallery item, Thumbnail accessory, etc) -- confirmed live 2026-08-10 13:12 EDT:
// a real upload's response came back with `attachments: []` at the top level even though the file
// genuinely uploaded and its resolved url was sitting inside `components[...].items[0].media.url` the
// whole time. This bug meant discordCdnUrl was ALWAYS null from the very first render onward -- every
// fallback to the slower fetch+reattach path was this bug working exactly as (mis)coded, not a race
// condition or a timing issue (an earlier fix that awaited the context-metadata patch, thinking THAT
// was the problem, was correct in principle but addressed a symptom that could never have mattered
// here). Walks generically (any `media.url` field anywhere in the tree) rather than hardcoding the
// specific component shape this module happens to send today, so it stays correct if a caller's
// layout changes.
function findFirstMediaUrl(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.media?.url && /^https:\/\/cdn\.discordapp\.com\//.test(node.media.url)) return node.media.url;
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
            for (const item of value) {
                const found = findFirstMediaUrl(item);
                if (found) return found;
            }
        } else if (value && typeof value === 'object') {
            const found = findFirstMediaUrl(value);
            if (found) return found;
        }
    }
    return null;
}

async function uploadToStorageChannel(channelId, filename, buffer, contentType, components) {
    if (!channelId) return null;
    try {
        const msg = await getRest().post(Routes.channelMessages(channelId), {
            body: { flags: 32768, components },
            files: [{ name: filename, contentType, data: buffer }]
        });
        return findFirstMediaUrl(msg.components) || msg.attachments?.[0]?.url || null;
    } catch (err) {
        console.error(`Discord CDN storage-channel upload failed for "${filename}": ${err.message}`);
        return null;
    }
}

// Same walk as findFirstMediaUrl, generalized to collect EVERY resolved cdn.discordapp.com media url
// instead of stopping at the first (2026-08-15 10:35 EDT, added for scripts/bulkCacheCollectibles.js's
// grouped multi-variant cache-channel messages -- "keeping the channel tidy" per Harkirat's request).
// Visits arrays/object values in the SAME deterministic order findFirstMediaUrl always has, which is
// what makes positional zipping safe: the caller builds `files` and `components` in one loop over its
// variants (file[i]'s `attachment://filename` sits in components entry i), and Discord neither reorders
// components in its response nor gives any other reliable way to map a resolved url back to which
// attachment it came from (`message.attachments` is frequently `[]` for a `attachment://` ref used only
// inside a component -- see findFirstMediaUrl's own comment). So `findAllMediaUrls(msg.components)[i]`
// is that same i-th variant's resolved url, as long as the caller preserves that ordering -- it is the
// caller's responsibility, not enforced here.
function findAllMediaUrls(node, out = []) {
    if (!node || typeof node !== 'object') return out;
    if (node.media?.url && /^https:\/\/cdn\.discordapp\.com\//.test(node.media.url)) out.push(node.media.url);
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
            for (const item of value) findAllMediaUrls(item, out);
        } else if (value && typeof value === 'object') {
            findAllMediaUrls(value, out);
        }
    }
    return out;
}

// Multi-file sibling of uploadToStorageChannel (2026-08-15 10:35 EDT) -- posts several rendered files as
// ONE message (one design's several color variants, grouped) instead of one message per file. `files`:
// `[{name, contentType, data}, ...]`, in the SAME order the caller's `components` tree references them
// via `attachment://<name>`. Returns an array of resolved cdn.discordapp.com urls in that same order (a
// `null` entry where a particular file's url could not be resolved), or `null` on total failure (channel
// not configured, or the whole request failed) -- never throws, same non-blocking contract as the
// single-file function above.
async function uploadMultipleToStorageChannel(channelId, files, components) {
    if (!channelId || !files?.length) return null;
    try {
        const msg = await getRest().post(Routes.channelMessages(channelId), {
            body: { flags: 32768, components },
            files: files.map(f => ({ name: f.name, contentType: f.contentType, data: f.data }))
        });
        const urls = findAllMediaUrls(msg.components);
        // Pad/truncate to files.length rather than trusting the walk found exactly one url per file --
        // a partially-malformed component tree should degrade to "some urls missing", never throw or
        // silently misalign the rest of the array against the caller's file order.
        return files.map((_, i) => urls[i] || null);
    } catch (err) {
        console.error(`Discord CDN storage-channel grouped upload failed (${files.length} file(s)): ${err.message}`);
        return null;
    }
}

module.exports = { uploadToStorageChannel, uploadMultipleToStorageChannel };
