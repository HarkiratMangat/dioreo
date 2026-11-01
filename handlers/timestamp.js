// ==========================================
// TIMESTAMP — INTERACTION HANDLER
// ==========================================
// /timestamp's style dropdown. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `tsmenu|`. Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so deciding ownership up front cannot change which handler wins, and every branch below keeps the exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleTimestampInteraction is awaited from inside handlers/router.js's single top-level try/catch -- do not add one here, do not register listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare `return interaction.reply(...)` can reject after the try has exited and escape the net. See .claude/rules/interaction-router.md.

const { buildSyntheticInteraction } = require('../utils/interactionContext');

// tsedit| / tseditm| (Edit timestamp, its form) and tszone| / tszonem: / tszonepick: (Set timezone / My timezone, its box, its "which one" pick) since 2026-11-01 15:19 EDT, Harkirat's panel update.
const OWNED_PREFIXES = ["tsmenu|", "tsedit|", "tseditm|", "tszone|", "tszonem:", "tszonepick:"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

const emojis = require('../utils/emojiMap');
const { panelState, editModal } = require('../utils/timestampPanel');


// The accent a render uses: teal unless the presser saved a single format as their style (the rule commands/timestamp.js's own execute() applies).
async function accentFor(interaction, timestampCommand, prefs) {
    const { getAccentColorForCommand } = require('../utils/accentColor');
    const personal = Boolean(prefs?.timestampStyle) && !timestampCommand.OVERVIEW_STYLES.includes(prefs.timestampStyle);
    return personal ? await getAccentColorForCommand(interaction, prefs, timestampCommand.PRESET_ACCENT) : timestampCommand.PRESET_ACCENT;
}

async function prefsOf(userId) {
    const UserPreference = require('../models/UserPreference');
    return await UserPreference.findOne({ discordId: userId });
}
const zoneSaved = prefs => Boolean(prefs?.timezoneSetAt && prefs?.timezone);


const fieldText = (interaction, id) => { try { return (interaction.fields.getTextInputValue(id) || '').trim(); } catch { return ''; } };
const fieldPick = (interaction, id) => { try { return interaction.fields.getStringSelectValues(id)[0] || null; } catch { return null; } };

async function privately(interaction, content) {
    try {
        if (interaction.deferred || interaction.replied) await interaction.followUp({ content, flags: 64 });
        else await interaction.reply({ content, flags: 64 });
    } catch (error) {
        console.error('Failed to answer a /timestamp button privately:', error?.message);
    }
}

async function route(interaction) {
        // TIMESTAMP STYLE SELECTOR Look for the new pipe delimiter prefix to handle stateless timestamp dropdowns NOTE (de-duplicated during review): this used to fully re-implement both of commands/timestamp.js's view layouts inline instead of calling back into that file — the two copies had already drifted out of sync across two earlier redesigns. Now uses the same synthetic-interaction reuse pattern as every other command, passing the already-known unix/tz/queryInput through so timestamp.js's execute() doesn't need to re-parse the original natural-language input (which could resolve differently the second time for a relative input like "tomorrow").
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('tsmenu|')) {
            // PRO FIX: Instantly defer the update to tell Discord we are processing. This permanently extends the 3-second timeout window to 15 minutes, preventing 10062 crashes.
            await interaction.deferUpdate();

            // Split out parameters safely using the pipe (|) delimiter so timezones like Asia/Hong_Kong don't fracture
            const parts = interaction.customId.split('|');
            // `unix~endUnix` for a range (2026-10-20 19:14 EDT), plain `unix` otherwise.
            const [unix, endUnix] = parts[1].split('~');
            const tz = parts[2];
            const originalQueryText = parts.slice(3).join('|');
            const selectedStyle = interaction.values[0];

            const timestampCommand = interaction.client.commands.get('timestamp');
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });

            // Resolve the same accent color the initial render would have used (2026-07-12) -- fixed teal unless the user's SAVED default style (prefs.timestampStyle) is a single format rather than one of the two overviews (OVERVIEW_STYLES), same rule timestamp.js's own execute() applies. Computed here since overrideState skips the normal option-resolution logic entirely.
            const UserPreference = require('../models/UserPreference');
            const { getAccentColorForCommand } = require('../utils/accentColor');
            const tsPrefs = await UserPreference.findOne({ discordId: interaction.user.id });
            const usesPersonalizedAccent = Boolean(tsPrefs?.timestampStyle) && !timestampCommand.OVERVIEW_STYLES.includes(tsPrefs.timestampStyle);
            const accentColor = usesPersonalizedAccent
                ? await getAccentColorForCommand(interaction, tsPrefs, timestampCommand.PRESET_ACCENT)
                : timestampCommand.PRESET_ACCENT;

            // The button row keeps its owner and colour through a style switch (2026-11-01): read off the message; a panel from before the row asks the owner's own record.
            const panel = panelState(interaction.message, interaction.user.id);
            const ownerHasZone = panel.ownerHasZone ?? zoneSaved(panel.ownerId === interaction.user.id ? tsPrefs : await prefsOf(panel.ownerId));

            return await timestampCommand.execute(syntheticInteraction, {
                ownerId: panel.ownerId, ownerHasZone,
                unix, endUnix: endUnix || null, tz, queryInput: originalQueryText,
                style: selectedStyle === 'all_formats' ? null : selectedStyle,
                // Preserve whether the message being edited was ephemeral — Discord doesn't let an edit change a message's ephemeral state either way, but timestamp.js still needs this to know whether to keep showing the "Share Publicly" button after a style switch (it otherwise has no other way to know, since overrideState skips the normal ephemeral-resolution logic entirely).
                ephemeral: Boolean(interaction.message.flags?.bitfield & 64),
                // isTextMode (2026-07-14): same derive-from-the-existing-message trick as ephemeral above -- text mode never sets the Components V2 flag (32768), so its ABSENCE on the message being edited means "this was rendered as text, stay in text" when switching styles via the dropdown.
                isTextMode: !(interaction.message.flags?.bitfield & 32768),
                accentColor
            });
        }
}

// The second half of route(): the panel's buttons, their form and box (2026-11-01 15:19 EDT, Harkirat's panel update).
async function routeButtons(interaction) {
    const timestampCommand = interaction.client.commands.get('timestamp');
    const presser = interaction.user.id;

    // Edit timestamp: the form, filled from the panel. It must be the first response, so no defer.
    if (interaction.isButton() && interaction.customId.startsWith('tsedit|')) {
        return await interaction.showModal(editModal(panelState(interaction.message, presser)));
    }

    // The form sent. The owner's panel changes in place; a change of view is a new message (a panel cannot switch between embed and text by an edit), and anyone else gets their own private copy, so nobody edits someone else's message.
    if (interaction.isModalSubmit() && interaction.customId.startsWith('tseditm|')) {
        const { resolveTimezone } = require('../utils/timezoneData');
        const state = panelState(interaction.message, presser);
        const ownerId = interaction.customId.split('|')[1];
        const when = fieldText(interaction, 'when');
        const typed = fieldText(interaction, 'zonequery');
        let tz = fieldPick(interaction, 'zone') || state.tz;
        if (typed) {
            tz = resolveTimezone(typed);
            if (!tz) return await privately(interaction, `${emojis.cross} No timezone matches "${typed.slice(0, 60)}". Try a city, a country or an abbreviation like PST.`);
        }
        const parsed = timestampCommand.parseQuery(when, tz);
        if (!parsed) return await privately(interaction, `${emojis.cross} Could not read a time in "${when.slice(0, 80)}". Try \`tomorrow\`, \`sun at 4:30pm\`, \`july17 8pm\` or \`19:30\`.`);
        const isTextMode = (fieldPick(interaction, 'view') || (state.isTextMode ? 'text' : 'embed')) === 'text';
        const stylePick = fieldPick(interaction, 'style') || 'all_formats';
        const own = presser === ownerId;
        const prefs = await prefsOf(presser);
        const inPlace = own && Boolean(interaction.message) && isTextMode === state.isTextMode;
        const ephemeral = own ? state.ephemeral : true;
        if (inPlace) await interaction.deferUpdate();
        else await interaction.deferReply({ flags: ephemeral ? 64 : 0 });
        const { buildSyntheticInteraction } = require('../utils/interactionContext');
        return await timestampCommand.execute(buildSyntheticInteraction(interaction, { deferReply: async () => { } }), {
            unix: parsed.unix, endUnix: parsed.endUnix || null, tz, queryInput: when.replace(/\|/g, ' '),
            style: stylePick === 'all_formats' ? null : stylePick,
            ephemeral, isTextMode, accentColor: await accentFor(interaction, timestampCommand, prefs),
            ownerId: own ? ownerId : presser, ownerHasZone: own && state.ownerHasZone !== null ? state.ownerHasZone : zoneSaved(prefs),
        });
    }

    // Set timezone / My timezone: /remind's own box (a quick pick and a search), saving the PRESSER's zone.
    if (interaction.isButton() && interaction.customId.startsWith('tszone|')) {
        const { zoneModal, userZone } = require('../utils/timezoneBox');
        return await interaction.showModal(zoneModal(presser, await userZone(presser), 'tszonem'));
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('tszonem:')) {
        const { searchTimezones } = require('../utils/timezoneData');
        const query = fieldText(interaction, 'query');
        const found = query ? searchTimezones(query, 24) : [];
        const tz = query ? (found.length === 1 ? found[0].value : null) : fieldPick(interaction, 'zone');
        if (!tz) {
            if (found.length > 1) {
                try {
                    return await interaction.reply({ content: `${emojis.timezone} Which one do you mean?`, flags: 64, components: [{ type: 1, components: [{ type: 3, custom_id: `tszonepick:${presser}`, placeholder: 'Pick your timezone…', options: found.slice(0, 25).map(o => ({ label: String(o.label).slice(0, 100), value: o.value, ...(o.description ? { description: String(o.description).slice(0, 100) } : {}) })) }] }] });
                } catch (error) { console.error('Failed to send the /timestamp timezone choices:', error?.message); return; }
            }
            return await privately(interaction, `${emojis.cross} ${query ? 'No timezone matches that. Try a city, a country or an abbreviation like PST.' : 'Pick a timezone from the list, or type one to search.'}`);
        }
        await require('../utils/timezoneBox').saveZone(presser, tz);
        const state = panelState(interaction.message, presser);
        // The owner's own blue Set timezone turns grey My timezone on the panel at once.
        if (interaction.message && state.ownerId === presser && state.ownerHasZone === false && state.unix) {
            await interaction.deferUpdate();
            const { buildSyntheticInteraction } = require('../utils/interactionContext');
            await timestampCommand.execute(buildSyntheticInteraction(interaction, { deferReply: async () => { } }), {
                ...state, accentColor: await accentFor(interaction, timestampCommand, await prefsOf(presser)), ownerHasZone: true,
            });
        }
        return await privately(interaction, zoneSetLine(interaction, tz));
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('tszonepick:')) {
        await interaction.deferUpdate();
        await require('../utils/timezoneBox').saveZone(presser, interaction.values[0]);
        return await interaction.editReply({ content: zoneSetLine(interaction, interaction.values[0]), components: [] });
    }
}

// The confirmation, naming where the zone is used (it is one saved zone, read by every command that shows a time).
function zoneSetLine(interaction, tz) {
    const { timezoneBaseLabel } = require('../utils/timezoneData');
    const { mentionCommand } = require('../utils/commandMentions');
    const c = name => mentionCommand(interaction.client, name);
    return `${emojis.checkmark} Timezone set to **${timezoneBaseLabel(tz)}**. ${c('timestamp')}, ${c('remind')} and ${c('settings')} use it.`;
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleTimestampInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    if (interaction.customId.startsWith('tsmenu|')) await route(interaction);
    else await routeButtons(interaction);
    return true;
}

module.exports = { handleTimestampInteraction, OWNED_PREFIXES };
