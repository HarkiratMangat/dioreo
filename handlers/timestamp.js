// ==========================================
// TIMESTAMP — INTERACTION HANDLER
// ==========================================
// /timestamp's style dropdown. Lifted out of handlers/router.js on 2026-08-13 17:45 EDT (docs/ROADMAP.md's index.js split). The branch bodies are VERBATIM -- only their address changed.
//
// Ownership is decided by custom_id prefix, once, before any branch runs: `tsmenu|`. Those prefixes are matched by no other subsystem (checked mechanically at extraction time), so deciding ownership up front cannot change which handler wins, and every branch below keeps the exact `return` it was written with.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleTimestampInteraction is awaited from inside handlers/router.js's single top-level try/catch -- do not add one here, do not register listeners, and keep every error-branch reply an AWAITED call in its own small try/catch. A bare `return interaction.reply(...)` can reject after the try has exited and escape the net. See .claude/rules/interaction-router.md.

const { buildSyntheticInteraction, resolvePanelActor } = require('../utils/interactionContext');

const OWNED_PREFIXES = ["tsmenu|"];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
        // TIMESTAMP STYLE SELECTOR Look for the new pipe delimiter prefix to handle stateless timestamp dropdowns NOTE (de-duplicated during review): this used to fully re-implement both of commands/timestamp.js's view layouts inline instead of calling back into that file — the two copies had already drifted out of sync across two earlier redesigns. Now uses the same synthetic-interaction reuse pattern as every other command, passing the already-known unix/tz/queryInput through so timestamp.js's execute() doesn't need to re-parse the original natural-language input (which could resolve differently the second time for a relative input like "tomorrow").
        if (interaction.customId.startsWith('tsmenu|')) {
            // PRO FIX: Instantly defer the update to tell Discord we are processing. This permanently extends the 3-second timeout window to 15 minutes, preventing 10062 crashes.
            await interaction.deferUpdate();

            // Split out parameters safely using the pipe (|) delimiter so timezones like Asia/Hong_Kong don't fracture
            const parts = interaction.customId.split('|');
            const unix = parts[1];
            const tz = parts[2];
            const originalQueryText = parts.slice(3).join('|');
            const selectedStyle = interaction.values[0];

            const timestampCommand = interaction.client.commands.get('timestamp');
            const syntheticInteraction = buildSyntheticInteraction(interaction, { deferReply: async () => { } });

            // Resolve the same accent color the initial render would have used (2026-07-12) -- fixed teal unless the user's SAVED default style (prefs.timestampStyle) isn't 'all_formats', same rule timestamp.js's own execute() applies. Computed here since overrideState skips the normal option-resolution logic entirely.
            const UserPreference = require('../models/UserPreference');
            const { getAccentColorForCommand } = require('../utils/accentColor');
            const tsPrefs = await UserPreference.findOne({ discordId: interaction.user.id });
            const usesPersonalizedAccent = tsPrefs?.timestampStyle && tsPrefs.timestampStyle !== 'all_formats';
            const accentColor = usesPersonalizedAccent
                ? await getAccentColorForCommand(interaction, tsPrefs, timestampCommand.PRESET_ACCENT)
                : timestampCommand.PRESET_ACCENT;

            return await timestampCommand.execute(syntheticInteraction, {
                unix, tz, queryInput: originalQueryText,
                style: selectedStyle === 'all_formats' ? null : selectedStyle,
                // Preserve whether the message being edited was ephemeral — Discord doesn't let an edit change a message's ephemeral state either way, but timestamp.js still needs this to know whether to keep showing the "Share Publicly" button after a style switch (it otherwise has no other way to know, since overrideState skips the normal ephemeral-resolution logic entirely).
                ephemeral: Boolean(interaction.message.flags?.bitfield & 64),
                // isTextMode (2026-07-14): same derive-from-the-existing-message trick as ephemeral above -- text mode never sets the Components V2 flag (32768), so its ABSENCE on the message being edited means "this was rendered as text, stay in text" when switching styles via the dropdown.
                isTextMode: !(interaction.message.flags?.bitfield & 32768),
                accentColor
            });
        }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleTimestampInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleTimestampInteraction, OWNED_PREFIXES };
