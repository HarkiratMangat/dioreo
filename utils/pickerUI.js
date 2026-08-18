// ==========================================
// PICKER UI — shared searchable-dropdown shape
// ==========================================
// The shared render primitives for a "shortlist + search sentinel" picker (v3-pre-release review finding #48: /settings' CP-currency and Timezone pickers were line-for-line clones of each other, with utils/cpCurrencyData.js's own header admitting it "mirrors utils/timezoneData.js's exact shape"). Both pickers now parameterize into this module for their UI, and into utils/settingsPickers.js's registry for their per-picker data/wording. Pure builders only -- no interaction, Mongoose, or discord.js side effects beyond constructing objects/builders.
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

// Builds the type-1 action row wrapping a type-3 select: the given `options` (each {label,value}) marked `default` against `currentValue`, plus a trailing search-sentinel option -- the shape every quick-pick+search dropdown in /settings shares (Discord's own select menu caps at 25 options, so a longer list can only ever be searched, never all shown at once).
function buildPickerSelectRow({ customId, placeholder, options, currentValue, searchValue = '__search__', searchLabel, searchDescription }) {
    return {
        type: 1,
        components: [{
            type: 3, custom_id: customId, placeholder,
            options: [
                ...options.map(o => ({ label: o.label, value: o.value, default: o.value === currentValue })),
                { label: searchLabel, value: searchValue, description: searchDescription }
            ]
        }]
    };
}

// Builds the one-field search modal shown when the "Search for your..." sentinel is picked. Builder classes, not raw snake_case API JSON -- matches every other showModal() call in this bot.
function buildPickerSearchModal({ customId, title, fieldLabel, fieldPlaceholder }) {
    return new ModalBuilder().setCustomId(customId).setTitle(title).addComponents(
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('query').setLabel(fieldLabel)
                .setStyle(TextInputStyle.Short).setPlaceholder(fieldPlaceholder)
                .setRequired(true).setMaxLength(60)
        )
    );
}

module.exports = { buildPickerSelectRow, buildPickerSearchModal };
