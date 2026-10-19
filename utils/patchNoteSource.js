// utils/patchNoteSource.js
// ==========================================
// WHAT A RIGHT-CLICKED MESSAGE GIVES "Add to Patch Notes"
// ==========================================
// Pure helpers for commands/addToPatchNotes.js and handlers/addToPatchNotes.js (added 2026-10-19 10:22 EDT). No discord.js, no database: the message comes in as discord.js hands it to a context-menu interaction, and everything here is a plain value so scripts/addToPatchNotes.test.js can pin it.
//
// A FORWARD carries the original in `messageSnapshots` (measured 2026-10-19 10:00 EDT: the forward's own copy is blank and the snapshot holds the content and every attachment, Message Content intent or not). Right-clicking the ORIGINAL works too, from a server the bot isn't in (measured 10:17 EDT): its own copy is full. So the source is the snapshot when there is one, else the message itself.

// The disclaimer Leakers on Duty end every post with. /patch notes already shows its own, so it is dropped rather than copied into Additional Info (Harkirat, 2026-10-19 10:13 EDT: "ignore the "Note that final patchnotes are subject to change."").
const DISCLAIMER = /final\s+patch\s*notes?\s+(are|is)\s+subject\s+to\s+change/i;
// A first line written as a heading or wrapped in bold/underline is the post's title ("**__Season 8 2026 Balance Changes__**"), which he also asked to ignore.
const TITLE_LINE = /^\s*(#{1,3}\s|\*\*|__)/;
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif)(\?|$)/i;
const MAX_IMAGES = 10; // patchNotes[].images holds 10: URLs 1 = 0-4, URLs 2 = 5-9

function sourceMessage(message) {
    const snapshot = message?.messageSnapshots?.first?.();
    return snapshot || message;
}

function imageUrls(msg) {
    const fromAttachments = [...(msg?.attachments?.values?.() ?? [])]
        .filter(a => (a.contentType || '').startsWith('image/') || (!a.contentType && IMAGE_EXT.test(a.name || a.url || '')))
        .map(a => a.url);
    const fromEmbeds = (msg?.embeds ?? []).flatMap(e => [e.image?.url, e.thumbnail?.url]).filter(Boolean);
    return [...new Set([...fromAttachments, ...fromEmbeds])];
}

// Everything in the post that is neither its title line nor the disclaimer -- "sometimes genuine additional info might be included in the message so parse out that info and prefill it" (Harkirat, 2026-10-19 10:13 EDT).
function extraInfo(content) {
    const lines = String(content || '').split('\n');
    const firstReal = lines.findIndex(l => l.trim());
    const kept = lines.filter((line, i) => !(i === firstReal && TITLE_LINE.test(line)) && !DISCLAIMER.test(line));
    return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// The original post's time. A snapshot is built with the ORIGINAL message's id (discord.js's Message.js), so its createdTimestamp is the original post time, not the forward's.
function postedAt(message) {
    const ts = sourceMessage(message)?.createdTimestamp;
    return Number.isFinite(ts) ? new Date(ts) : null;
}

// The post's own title: its first line when that line is a heading or wrapped in bold/underline, with the markdown taken off. Used to pre-fill a title box (Add to Draws, Add to Calendar; 2026-10-19 11:16 EDT). Empty when the first line is plain text, since that is a sentence, not a title.
function titleLine(content) {
    const first = String(content || '').split('\n').find(l => l.trim()) || '';
    if (!TITLE_LINE.test(first)) return '';
    return first.replace(/^\s*#{1,3}\s+/, '').replace(/\*\*|__/g, '').trim();
}

function extractSource(message) {
    const src = sourceMessage(message);
    return {
        images: imageUrls(src),
        title: titleLine(src?.content),
        content: String(src?.content || ''),
        info: extraInfo(src?.content),
        postedAt: postedAt(message),
        isForward: src !== message,
    };
}

// Add puts the new images after the season's own; Replace keeps only the new ones. Anything past 10 is cut, and `dropped` says how many so the panel can warn before the click.
function mergeImages(existing, incoming, mode) {
    const all = mode === 'replace' ? [...incoming] : [...(existing || []), ...incoming];
    return { images: all.slice(0, MAX_IMAGES), dropped: Math.max(0, all.length - MAX_IMAGES) };
}

// The season's own Additional Info is never overwritten: the message's extra text is appended, and only when it isn't already there.
function mergeInfo(existing, extra) {
    const own = String(existing || '').trim();
    if (!extra) return own;
    if (own.includes(extra)) return own;
    return own ? `${own}\n${extra}` : extra;
}

module.exports = { extractSource, extraInfo, titleLine, mergeImages, mergeInfo, MAX_IMAGES };
