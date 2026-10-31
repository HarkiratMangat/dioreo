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

// Inside a text command (bot/textCommands.js runs it with the request context's handler set to 'textCommands', and handlers/router.js marks its txtpriv_/txtrun_ buttons the same), a slash mention is plain text exactly where it is no use: text commands exist for the servers that hide slash commands, or list too many bots for Discord to show Dioreo's (text commands, B3, 2026-10-29). So a command with a text form is written as that form, `d draws` (`d dmz` for /gunsmith dmz), or `@Dioreo draws` where the app was not granted Message Content and the prefixes are off. A command with no text form (/admin, Dioreo Admin's commands) keeps its mention: it is still the only way to it. True while a text command (or one of its txtpriv_/txtrun_ buttons) is running, or while a click on a text command's reply is (handlers/router.js sets `textReply`; the spec's "Replies", B4 2026-10-29 10:32 EDT): the one test of it, so a page that words something differently for a typed command asks the same question mentionCommand does.
function inTextCommand() {
    const ctx = require('./requestContext').getContext();
    return ctx?.handler === 'textCommands' || ctx?.textReply === true;
}

function textForm(client, clean) {
    if (!inTextCommand()) return null;
    const { TEXT_COMMANDS } = require('./textCommands/commands');
    const hit = TEXT_COMMANDS.find(c => `${c.slash}${c.sub ? ` ${c.sub}` : ''}` === clean) || TEXT_COMMANDS.find(c => c.slash === clean);
    if (!hit) return null;
    // The first word in its list, never its name: gunsmith DMZ is named `gunsmith dmz` but typed `dmz` (`d gunsmith dmz` reads `dmz` as a weapon). The prefix is the one the person typed, or the server's own on a click (`textPrefix`, set by bot/textCommands.js and handlers/router.js; B7's fix-up, 2026-10-30 15:02 EDT): it was always `d`, which does not work in a server whose prefix replaced it, and his rule is that the example uses the prefix the person used.
    const prefix = client?.textMessageContent === false ? '@Dioreo' : (require('./requestContext').getContext()?.textPrefix || 'd');
    return `\`${prefix} ${hit.words[0]}\``;
}

function mentionCommand(client, path) {
    const clean = path.replace(/^\//, '');
    const text = textForm(client, clean);
    if (text) return text;
    const base = clean.split(' ')[0];
    const id = client?.commandIds?.get(base) ?? allCommandIds.get(base);
    return id ? `</${clean}:${id}>` : `\`/${clean}\``;
}

// The slash mention even inside a text command: /help's slash pages show slash names whatever opened them (B6, his rule 2026-10-29 20:45 EDT: a typed page names commands typed, a slash page keeps slash names).
function slashMention(client, path) {
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

// Turns each `/name` or `/name sub` in free text into a clickable mention, longest real path first (2026-10-28, Harkirat on the launch announcement: "why dont the slash commands have clickable?" -- its text is typed in the builder, so it held plain `/gunsmith mp`). Only a slash at the start of a line or after a space, bracket or markdown mark is read, so "Right-click/Tap" and a URL stay text; an unknown name, or one with no id yet, is left exactly as written. ⚠️ A mention already written as `</gunsmith mp:ID>` is re-pointed to THIS app's live id too. The launch announcement was written on the dev bot with the dev app's ids baked in and copied to prod, so its mentions resolved only in dioreoland (where the dev app is installed) and showed as plain text in every other server (sirri's, 2026-10-28). Ids differ per application, so stored text can never carry the right one.
// `slash: true` keeps slash mentions even inside a text command: an announcement always shows as it was posted (his call, 2026-10-30 22:48 EDT: "show the announcement as it was originally posted because otherwise it would show the prefix announce using slash commands, and that makes no sense"), so `d announce` never rewrites `/gunsmith mp` as `d gunsmith`.
function linkCommandMentions(text, client = null, { slash = false } = {}) {
    const mention = (c, path) => (slash ? slashMention(c, path) : mentionCommand(c, path));
    const repointed = String(text).replace(/<\/([a-z0-9_-]+(?: [a-z0-9_-]+){0,2}):(\d{17,20})>/g, (whole, path) => {
        const id = client?.commandIds?.get(path.split(' ')[0]) ?? allCommandIds.get(path.split(' ')[0]);
        return id && commandPaths.has(path) ? mention(client, path) : whole;
    });
    return repointed.replace(/(^|[\s(*_>~|])\/([a-z0-9_-]+)((?: [a-z0-9_-]+){0,2})/gm, (whole, pre, base, rest) => {
        const words = [base, ...rest.trim().split(' ').filter(Boolean)];
        for (let n = words.length; n >= 1; n--) {
            const path = words.slice(0, n).join(' ');
            const id = client?.commandIds?.get(base) ?? allCommandIds.get(base);
            if (id && commandPaths.has(path)) return `${pre}${mention(client, path)}${rest.slice(rest.split(' ').slice(0, n).join(' ').length)}`;
        }
        return whole;
    });
}

module.exports = { mentionCommand, slashMention, recordCommandIds, recordCommandPaths, linkCommandMentions, inTextCommand };
