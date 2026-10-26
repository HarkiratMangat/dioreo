// utils/openLoadoutCard.js
//
// Opens a saved build as its real /gunsmith card. Moved here from handlers/autobuild.js on 2026-10-26 11:55 EDT so /manage's Open in /gunsmith button can share it: a handler module exports one function (scripts/handlerRouting.test.js).
const BOT_EMOJI = require('./emojiMap');

// `ephemeral`: /manage's Open in /gunsmith shows the card privately, for checking a save (2026-10-26 11:54 EDT); /autobuild's Open Loadout keeps posting it.
async function openLoadout(interaction, loadoutId, { ephemeral = false } = {}) {
    const Loadout = require('../models/Loadout');
    const { buildLoadoutCard, getMpCategoryAccent } = require('./loadoutRender');
    const doc = await Loadout.findById(loadoutId).lean();
    if (!doc) {
        return interaction.reply({ content: require('./emojiMap').glyphs(BOT_EMOJI.cross + ' That loadout no longer exists.'), ephemeral: true });
    }
    // Render the weapon's FULL build set (not just this one doc) so the Prev/Next pagination and the correct "Build N of M" footer render, opening ON the just-created build. The PoC passed [doc] alone (found in live testing 2026-07-20): builds.length === 1, so buildPaginationRow returned null and the footer wrongly read "Build 1 of 1" even for a weapon that has several builds. Same weaponKey scope /gunsmith mp's own lookup uses. openIndex falls back to 0 if the doc somehow isn't in its own result set. Mode-aware since 2026-10-19 17:54 EDT, when /autobuild began writing DMZ builds: the same scopes /dmz uses (utils/loadoutLookup.js) -- the weapon's DMZ builds, every DMZ build for the browse dropdown, and the `dmz` id prefix so its pagination routes to the DMZ handler.
    const mode = doc.mode === 'DMZ' ? 'DMZ' : 'MP';
    const builds = await Loadout.find({ weaponKey: doc.weaponKey, mode }).lean();
    const openIndex = Math.max(0, builds.findIndex(b => String(b._id) === String(doc._id)));
    const categoryBuilds = mode === 'DMZ'
        ? await Loadout.find({ mode: 'DMZ' }).lean()
        : await Loadout.find({ category: doc.category, mode: 'MP' }).lean();
    const accentColor = getMpCategoryAccent(doc.category);
    const cardPayload = buildLoadoutCard(builds, openIndex, { color: accentColor, idPrefix: mode === 'DMZ' ? 'dmz' : 'mp', isEphemeral: ephemeral, categoryBuilds });
    await interaction.deferReply({ ephemeral });
    const { sendV2Payload } = require('./sendV2Payload');
    return await sendV2Payload(interaction, cardPayload.components, { flags: cardPayload.flags });
}

module.exports = { openLoadout };
