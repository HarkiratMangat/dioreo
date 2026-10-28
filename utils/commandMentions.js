// ==========================================
// UTILITY: NATIVE SLASH-COMMAND MENTIONS
// ==========================================
// Renders a real clickable </name:id> Discord command mention -- see docs/superpowers/specs/2026-08-10-slash-command-mentions-design.md for the full design. A subcommand mention (</name sub:id>) still uses the TOP-LEVEL command's id -- there is no separate id per subcommand -- so the lookup below is always keyed by the first word of `path`.
//
// IDs are captured fresh every boot onto `client.commandIds` (bot/registry.js's registerApplicationCommands(), from the same REST response that registers the commands) and read here at RENDER time, never baked into a module-level constant -- the dev bot and prod bot are separate Discord applications with different ids for identically-named commands, the same reason utils/emojiMap.js resolves emoji ids at render time instead of require() time.
//
// Fail-soft: an unknown or not-yet-populated id falls back to the exact backtick text this replaced, so a cold boot or a registration failure degrades to plain text, never a broken panel.

// Every registered command id across BOTH applications (2026-10-19 13:44 EDT, Dioreo Admin). A command lives on exactly one app, so names never collide; the public app's /help can then link /bot, which Dioreo Admin owns. Filled by bot/registry.js after each app's registration.
const allCommandIds = new Map();
function recordCommandIds(ids) {
    for (const [name, id] of ids) allCommandIds.set(name, id);
}

function mentionCommand(client, path) {
    const clean = path.replace(/^\//, '');
    const base = clean.split(' ')[0];
    const id = client?.commandIds?.get(base) ?? allCommandIds.get(base);
    return id ? `</${clean}:${id}>` : `\`/${clean}\``;
}

// Every slash-command path either app registered ('draws', 'draw prices', 'gunsmith mp'), so free text can be linked: a command that has subcommands only links by its full path, because Discord renders a bare `</gunsmith:id>` as plain text. Filled by bot/registry.js from the same PUT response as the ids.
const commandPaths = new Set();
function recordCommandPaths(paths) {
    for (const p of paths) commandPaths.add(p);
}

// Turns each `/name` or `/name sub` in free text into a clickable mention, longest real path first (2026-10-28, Harkirat on the launch announcement: "why dont the slash commands have clickable?" -- its text is typed in the builder, so it held plain `/gunsmith mp`). Only a slash at the start of a line or after a space, bracket or markdown mark is read, so "Right-click/Tap" and a URL stay text; an unknown name, or one with no id yet, is left exactly as written.
function linkCommandMentions(text, client = null) {
    return String(text).replace(/(^|[\s(*_>~|])\/([a-z0-9_-]+)((?: [a-z0-9_-]+){0,2})/gm, (whole, pre, base, rest) => {
        const words = [base, ...rest.trim().split(' ').filter(Boolean)];
        for (let n = words.length; n >= 1; n--) {
            const path = words.slice(0, n).join(' ');
            const id = client?.commandIds?.get(base) ?? allCommandIds.get(base);
            if (id && commandPaths.has(path)) return `${pre}${mentionCommand(client, path)}${rest.slice(rest.split(' ').slice(0, n).join(' ').length)}`;
        }
        return whole;
    });
}

module.exports = { mentionCommand, recordCommandIds, recordCommandPaths, linkCommandMentions };
