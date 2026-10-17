// ==========================================
// EMBED TESTER — pure helpers behind the dev-only /embedtest
// ==========================================
// Built 2026-10-17 11:04 EDT. Harkirat pastes a Components V2 payload (or a classic embed) and the dev bot posts it as a real message, so a design can be judged in the real Discord client — phone included — with the bot's own emojis, before any code is written for it. Everything here is pure (no discord.js, no network) so scripts/embedTester.test.js can drive it directly; commands/embedtest.js does the I/O.
//
// ⚠️ APPLICATION EMOJIS ONLY RENDER FOR THE APP THAT OWNS THEM. The dev and prod applications carry copies of the same emojis under the same NAMES with DIFFERENT ids (utils/emojiMap.js's refreshEmojiIds header). A mockup built against one app pasted into the other would show `:name:` as text, so a full mention whose id this app doesn't own is re-pointed by NAME, the same matching refreshEmojiIds uses.

// Discord message flag bits this tester reads. The rest are dropped: SUPPRESS_NOTIFICATIONS (4096) means nothing on an interaction reply, and EPHEMERAL (64) can only be chosen at the defer, never on the edit that delivers the content.
const FLAG_SUPPRESS_EMBEDS = 4;
const FLAG_EPHEMERAL = 64;
const FLAG_COMPONENTS_V2 = 32768;

// Component types that exist only under Components V2: section, text display, thumbnail, media gallery, file, separator, container (and the newer 15–16 slots). A payload carrying any of them cannot be sent without the V2 flag, so their presence turns it on even when the pasted JSON forgot the flag.
const V2_ONLY_TYPES = new Set([9, 10, 11, 12, 13, 14, 15, 16, 17]);
const SELECT_TYPES = new Set([3, 5, 6, 7, 8]);
const LINK_BUTTON_STYLE = 5;
const PREMIUM_BUTTON_STYLE = 6;

// Discord's documented cap: 40 components per message, counted recursively (root CLAUDE.md's platform cheat-sheet; a real production crash when exceeded).
const COMPONENT_CAP = 40;

const DUMMY_PREFIX = 'embedtest_dummy:';

/**
 * Text → a parsed object, or a readable error. Strips a ```json fence (pasting straight out of a chat code block is the common case) and reports a parse failure with the text around where it broke, because "Unexpected token } in JSON at position 1734" alone is unusable on a phone.
 */
function parseInput(raw) {
    let text = String(raw ?? '').trim();
    const fence = text.match(/^```[a-zA-Z]*\s*\n?([\s\S]*?)\n?```$/);
    if (fence) text = fence[1].trim();
    if (!text) return { error: 'Nothing to render — the JSON was empty.' };
    try {
        return { value: JSON.parse(text) };
    } catch (err) {
        const pos = Number((err.message.match(/position (\d+)/) || [])[1]);
        let where = '';
        if (Number.isFinite(pos)) {
            const before = text.slice(Math.max(0, pos - 40), pos);
            const after = text.slice(pos, pos + 40);
            where = `\n\`\`\`\n${before}⟪here⟫${after}\n\`\`\``;
        }
        return { error: `That isn't valid JSON: ${err.message}${where}` };
    }
}

/**
 * Accepts the four shapes a pasted design comes in — a full message `{ flags, components }`, a bare components array, a single component object, or a classic `{ content, embeds }` message — and returns one normalised message.
 */
function normalizePayload(value) {
    if (Array.isArray(value)) return normalizePayload({ components: value });
    if (!value || typeof value !== 'object') return { error: 'Expected a JSON object or array of components.' };
    // A lone component (a container, a text display) carries a numeric `type`; a message never does. Wrapped as the message's only top-level component.
    if (typeof value.type === 'number') return normalizePayload({ components: [value] });

    const components = Array.isArray(value.components) ? value.components : [];
    const embeds = Array.isArray(value.embeds) ? value.embeds : undefined;
    const content = typeof value.content === 'string' ? value.content : '';
    const flags = Number.isInteger(value.flags) ? value.flags : 0;

    const isV2 = Boolean(flags & FLAG_COMPONENTS_V2) || containsType(components, V2_ONLY_TYPES);
    if (!components.length && !embeds?.length && !content) return { error: 'There is nothing to show: no components, embeds or content.' };
    if (isV2 && (embeds?.length || content)) {
        return { error: 'A Components V2 message can\'t also carry `content` or `embeds` — Discord rejects the mix. Move the text into a text display (type 10).' };
    }

    return {
        components,
        embeds,
        content,
        isV2,
        ephemeral: Boolean(flags & FLAG_EPHEMERAL),
        sendFlags: (isV2 ? FLAG_COMPONENTS_V2 : 0) | (flags & FLAG_SUPPRESS_EMBEDS),
    };
}

// Walks every component, including a section's `accessory` and anything nested under `components`.
function walkComponents(list, visit) {
    for (const c of list || []) {
        if (!c || typeof c !== 'object') continue;
        visit(c);
        if (Array.isArray(c.components)) walkComponents(c.components, visit);
        if (c.accessory && typeof c.accessory === 'object') walkComponents([c.accessory], visit);
    }
}

function containsType(list, types) {
    let found = false;
    walkComponents(list, c => { if (types.has(c.type)) found = true; });
    return found;
}

function countComponents(list) {
    let n = 0;
    walkComponents(list, () => { n++; });
    return n;
}

/**
 * Gives every non-link button and every select a fresh `embedtest_dummy:N` id, so nothing on the preview is wired to a real handler and every id is unique (Discord rejects duplicates). Link buttons keep their URL — they open a page and never reach the bot. Returns how many controls were made dummies.
 */
function dummyComponents(list) {
    let n = 0;
    walkComponents(list, c => {
        if (c.type === 2 && c.style !== LINK_BUTTON_STYLE && c.style !== PREMIUM_BUTTON_STYLE) {
            c.custom_id = `${DUMMY_PREFIX}${n++}`;
        } else if (SELECT_TYPES.has(c.type)) {
            c.custom_id = `${DUMMY_PREFIX}${n++}`;
        }
    });
    return n;
}

/**
 * The bot's application emojis → lookups. `list` is the `items` array of GET /applications/{id}/emojis.
 */
function buildEmojiIndex(list) {
    const byId = new Map();
    const byName = new Map();
    const byLower = new Map(); // lower-cased name -> every emoji sharing it, so an ambiguous case-insensitive match is refused rather than guessed
    for (const e of list || []) {
        if (!e?.id || !e?.name) continue;
        byId.set(String(e.id), e);
        byName.set(e.name, e);
        const k = e.name.toLowerCase();
        byLower.set(k, [...(byLower.get(k) || []), e]);
    }
    return { byId, byName, byLower };
}

function findByName(index, name) {
    if (index.byName.has(name)) return index.byName.get(name);
    const same = index.byLower.get(name.toLowerCase()) || [];
    return same.length === 1 ? same[0] : null;
}

const mention = e => `<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`;

// A full mention, or a bare :name:. The full form is matched first at each position, so its own inner `:name:` is never re-matched. A name needs a letter before it is reported as missing, so `12:30:45` and the `:1700000000:` inside a `<t:…:R>` timestamp are left alone silently.
const EMOJI_TOKEN = /<(a?):(\w{2,32}):(\d{15,25})>|:(\w{2,32}):/g;

function resolveText(text, index, report) {
    return text.replace(EMOJI_TOKEN, (whole, a, fullName, id, bareName) => {
        if (fullName) {
            const own = index.byId.get(id);
            if (own) {
                if (Boolean(a) !== Boolean(own.animated)) report.fixed.push(own.name);
                return mention(own);
            }
            const named = findByName(index, fullName);
            if (named) { report.remapped.push(named.name); return mention(named); }
            report.unresolved.push(fullName);
            return whole;
        }
        const named = findByName(index, bareName);
        if (named) { report.named.push(named.name); return mention(named); }
        if (/[a-zA-Z]/.test(bareName)) report.unresolved.push(bareName);
        return whole;
    });
}

// An `emoji` field: `{ id, name, animated }`, `{ name }` alone, or a string written the way text is ("<:x:1>" or ":x:"). A unicode emoji (`{ name: "🔥" }`) has no word characters and is left as it is.
function resolveEmojiField(field, index, report) {
    if (typeof field === 'string') {
        const s = field.trim();
        const full = s.match(/^<(a?):(\w{2,32}):(\d{15,25})>$/);
        const bare = s.match(/^:(\w{2,32}):$/);
        if (full) return resolveEmojiField({ id: full[3], name: full[2], animated: Boolean(full[1]) }, index, report);
        if (bare) return resolveEmojiField({ name: bare[1] }, index, report);
        return { name: s }; // a unicode emoji typed as a plain string
    }
    if (!field || typeof field !== 'object') return field;
    if (field.id) {
        const own = index.byId.get(String(field.id));
        if (own) return { id: own.id, name: own.name, animated: Boolean(own.animated) };
    }
    if (typeof field.name === 'string' && /\w/.test(field.name)) {
        const named = findByName(index, field.name.replace(/^:|:$/g, ''));
        if (named) {
            (field.id ? report.remapped : report.named).push(named.name);
            return { id: named.id, name: named.name, animated: Boolean(named.animated) };
        }
        report.unresolved.push(field.name);
    }
    return field;
}

/**
 * Re-points every emoji in a normalised message at this app's own emojis. Mutates the message's components/embeds in place (they are the caller's private copy) and returns a report of what changed.
 */
function resolveEmojis(message, index) {
    const report = { named: [], remapped: [], fixed: [], unresolved: [] };
    const textKeys = ['content'];
    walkComponents(message.components, c => {
        for (const k of textKeys) if (typeof c[k] === 'string') c[k] = resolveText(c[k], index, report);
        if ('emoji' in c) c.emoji = resolveEmojiField(c.emoji, index, report);
        if (Array.isArray(c.options)) for (const o of c.options) if (o && 'emoji' in o) o.emoji = resolveEmojiField(o.emoji, index, report);
    });
    if (message.content) message.content = resolveText(message.content, index, report);
    for (const e of message.embeds || []) {
        if (typeof e.title === 'string') e.title = resolveText(e.title, index, report);
        if (typeof e.description === 'string') e.description = resolveText(e.description, index, report);
        for (const f of e.fields || []) {
            if (typeof f.name === 'string') f.name = resolveText(f.name, index, report);
            if (typeof f.value === 'string') f.value = resolveText(f.value, index, report);
        }
    }
    for (const k of Object.keys(report)) report[k] = [...new Set(report[k])];
    return report;
}

/**
 * Discord's 50035 "Invalid Form Body" carries a tree of field errors; flattened here to one line per field, e.g. `components[0].components[3].content: Must be 4000 or fewer in length.`
 */
function formatDiscordError(err) {
    const lines = [];
    const walk = (node, path) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node._errors)) {
            for (const e of node._errors) lines.push(`${path || '(message)'}: ${e.message}`);
        }
        for (const [k, v] of Object.entries(node)) {
            if (k === '_errors') continue;
            walk(v, /^\d+$/.test(k) ? `${path}[${k}]` : (path ? `${path}.${k}` : k));
        }
    };
    walk(err?.rawError?.errors, '');
    const head = `${err?.code ? `Discord error ${err.code}: ` : ''}${err?.rawError?.message || err?.message || String(err)}`;
    return lines.length ? `${head}\n${lines.map(l => `- ${l}`).join('\n')}` : head;
}

/**
 * The private note sent after a successful render — only when there is something worth saying.
 */
function formatReport(report, dummies) {
    const parts = [];
    if (report.named.length) parts.push(`Matched by name: ${report.named.map(n => `\`:${n}:\``).join(' ')}`);
    if (report.remapped.length) parts.push(`Not this bot's id, swapped by name: ${report.remapped.map(n => `\`${n}\``).join(' ')}`);
    if (report.fixed.length) parts.push(`Animated flag corrected: ${report.fixed.map(n => `\`${n}\``).join(' ')}`);
    if (report.unresolved.length) parts.push(`⚠️ Not found on this bot, left as written: ${report.unresolved.map(n => `\`:${n}:\``).join(' ')}`);
    if (!parts.length) return null;
    if (dummies) parts.push(`-# ${dummies} dummy control${dummies === 1 ? '' : 's'} — clicking does nothing.`);
    return parts.join('\n');
}

module.exports = {
    parseInput,
    normalizePayload,
    countComponents,
    dummyComponents,
    buildEmojiIndex,
    resolveEmojis,
    formatDiscordError,
    formatReport,
    COMPONENT_CAP,
    DUMMY_PREFIX,
};
