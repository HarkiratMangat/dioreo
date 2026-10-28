// utils/ephemeral.js Shared "explicit option > saved preference > default (public)" priority resolution, hand-rolled identically 7 times across calendar/draws/patchnotes/drawprices/seasonend/dmz/handlers/router.js's MP loadout fallback, differing only in which UserPreference field to check. One place to change if the priority rule itself ever needs to change, instead of 7. ⚠️ This resolves the USER's preference only, and deliberately knows nothing about the v3 server-admin visibility policy (2026-08-10 15:50 EDT, utils/guildPolicy.js). A server rule that forces ephemeral is applied at two choke points instead -- the reply/deferReply/followUp clamp on the interaction itself, and sendV2Payload's strip of the "Show Everyone" row -- neither of which any command has to remember. Threading a `guildPolicy` argument through here as well was built and then removed: it would have meant an optional parameter at nine call sites where forgetting it looks identical to passing it, which is the failure mode the choke points exist to prevent.
function resolveEphemeral({ argPrivate, prefs, prefsField }) {
    if (argPrivate !== null) return argPrivate;
    return prefs ? prefs[prefsField] === 'ephemeral' : false;
}

// A warning or error only the person who ran the command should see (2026-10-27 23:40 EDT, Harkirat: "shouldn't a warning like this be ephemeral?"). After a deferReply the first followUp BECOMES that deferred message, so it keeps the defer's visibility, often public. A public placeholder is deleted first and the notice goes out as a new ephemeral message. `ephemeral` is the defer's visibility; discord.js records it on the interaction when the caller does not say.
async function privateNotice(interaction, content, { ephemeral = interaction.ephemeral } = {}) {
    if ((interaction.deferred || interaction.replied) && !ephemeral) await interaction.deleteReply().catch(() => {});
    return interaction.followUp({ content, ephemeral: true });
}

module.exports = { resolveEphemeral, privateNotice };
