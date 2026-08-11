// ==========================================
// UTILITY: NATIVE SLASH-COMMAND MENTIONS
// ==========================================
// Renders a real clickable </name:id> Discord command mention -- see
// docs/superpowers/specs/2026-08-10-slash-command-mentions-design.md for the full design.
// A subcommand mention (</name sub:id>) still uses the TOP-LEVEL command's id -- there is no
// separate id per subcommand -- so the lookup below is always keyed by the first word of `path`.
//
// IDs are captured fresh every boot onto `client.commandIds` (index.js's handleBotReady(), from
// the same REST response that registers the commands) and read here at RENDER time, never baked
// into a module-level constant -- the dev bot and prod bot are separate Discord applications with
// different ids for identically-named commands, the same reason utils/emojiMap.js resolves emoji
// ids at render time instead of require() time.
//
// Fail-soft: an unknown or not-yet-populated id falls back to the exact backtick text this
// replaced, so a cold boot or a registration failure degrades to plain text, never a broken panel.

function mentionCommand(client, path) {
    const clean = path.replace(/^\//, '');
    const base = clean.split(' ')[0];
    const id = client?.commandIds?.get(base);
    return id ? `</${clean}:${id}>` : `\`/${clean}\``;
}

module.exports = { mentionCommand };
