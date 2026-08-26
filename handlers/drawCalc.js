// ==========================================
// /draw calculator -- INTERACTION HANDLER
// ==========================================
// Owns every calc~ interaction. Serves THREE interaction types -- buttons, string selects and modal submits -- so EVERY branch type-tests as well as prefix-tests. Skipping that is the exact defect that broke /settings pagination during the index.js split (see .claude/rules/interaction-router.md): two branches with byte-identical customId prefixes but different types, where the first swallowed the second.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleDrawCalcInteraction is awaited from inside handlers/router.js's single top-level try/catch -- do not add one here, do not register listeners, and keep every error-branch reply an AWAITED call in its own small try/catch.
//
// ⚠️ EVERY BRANCH ENDS IN THE SAME renderPanel() CALL. The panel is a pure function of the state in the customId, so a control's whole job is to produce the next state -- there is no "recalculate" step to forget, and no second panel that can drift from the first. When the two-stage flow was removed, `run` and `edit` (the old Calculate and Edit Inputs buttons) went with it; a decoded verb of either comes from a stale message and falls through to the unrecognised-verb path, which is the correct outcome -- the panel it belonged to no longer exists.
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { withShareButton } = require('../utils/shareButton');
const { buildGlobalNavRow } = require('../utils/globalNav');
const { getAccentColorForCommand } = require('../utils/accentColor');
const UserPreference = require('../models/UserPreference');
const {
    decodeState, encodeState, clampStateToDraw, buildCalculatorPanel, findLiveDoubleCPEntry
} = require('../commands/drawCalculator');
const { PRESET_ACCENT } = require('../commands/drawprices');
const { CP_PACKAGES } = require('../utils/cpPackages');

const OWNED_PREFIXES = ['calc~'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && customId.startsWith('calc~');
}

// Players type "3,000", "3000" and "3k" interchangeably. Rejecting two of those would read as the calculator being broken rather than strict. Returns null for genuinely invalid input so the caller can show a validation message instead of silently treating it as zero.
function parseAmount(raw) {
    if (!raw) return 0;
    const cleaned = String(raw).trim().toLowerCase().replace(/[, ]/g, '');
    if (cleaned === '') return 0;
    const k = cleaned.endsWith('k');
    const n = Number(k ? cleaned.slice(0, -1) : cleaned);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.floor(k ? n * 1000 : n);
}

// The modal now asks for ONE free-form amount, because that is all that is genuinely free-form. Pulls done and the target pull are bounded by the draw's own length and live on the panel as selects -- putting them in a text field is what forced a modal into the common path, and what made the seven-pull draws a validation problem in the first place.
function buildAmountModal(state) {
    const budgetMode = state.target === 'B';
    const field = budgetMode
        ? new TextInputBuilder().setCustomId('amount').setLabel('Budget to spend (CP)')
            .setStyle(TextInputStyle.Short).setPlaceholder('e.g. 5,000 or 5k')
            .setValue(state.targetValue ? String(state.targetValue) : '').setRequired(true)
        : new TextInputBuilder().setCustomId('amount').setLabel('CP you already have')
            .setStyle(TextInputStyle.Short).setPlaceholder('e.g. 3,000 or 3k')
            .setValue(state.balance ? String(state.balance) : '').setRequired(false);
    return new ModalBuilder()
        .setCustomId(encodeState('nums', state))
        .setTitle(budgetMode ? 'Set Your Budget' : 'Your CP Balance')
        .addComponents(new ActionRowBuilder().addComponents(field));
}

async function renderPanel(interaction, state, notice = null) {
    const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
    const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
    const liveDoubleCPEntry = await findLiveDoubleCPEntry();
    const isEphemeral = Boolean(interaction.message?.flags?.has?.(64));
    const panel = buildCalculatorPanel(clampStateToDraw(state), accentColor, {
        liveDoubleCPEntry,
        currency: prefs?.cpCurrency || 'USD',
        client: interaction.client,
        notice
    });
    const nav = buildGlobalNavRow('nav_prices');
    return sendV2Payload(interaction, withShareButton([panel, nav], isEphemeral));
}

async function route(interaction) {
    const state = decodeState(interaction.customId);

    // showModal() must be the DIRECT response to the button -- it cannot follow a deferReply or deferUpdate. Same constraint documented in handlers/autobuild.js.
    if (interaction.isButton() && state.verb === 'modal') {
        return await interaction.showModal(buildAmountModal(state));
    }

    if (interaction.isModalSubmit() && state.verb === 'nums') {
        const amount = parseAmount(interaction.fields.getTextInputValue('amount'));
        if (amount === null) {
            try {
                await interaction.reply({ content: '❌ That amount was not understood — try a plain number like `3000` or `3k`.', ephemeral: true });
            } catch (notifyError) { console.error('Failed to notify user of invalid amount (interaction likely expired):', notifyError); }
            return true;
        }
        await interaction.deferUpdate();
        await renderPanel(interaction, state.target === 'B' ? { ...state, targetValue: amount } : { ...state, balance: amount });
        return true;
    }

    if (interaction.isStringSelectMenu() && state.verb === 'draw') {
        await interaction.deferUpdate();
        // includeUpgrades resets with the draw: an upgrade toggled on for a mythic draw means nothing on a draw that has no upgrade step, and clampStateToDraw cannot see that from pull counts alone.
        await renderPanel(interaction, { ...state, drawKey: interaction.values[0], includeUpgrades: false });
        return true;
    }

    if (interaction.isStringSelectMenu() && state.verb === 'pulls') {
        await interaction.deferUpdate();
        await renderPanel(interaction, { ...state, pullsDone: Number(interaction.values[0]) || 0 });
        return true;
    }

    if (interaction.isStringSelectMenu() && state.verb === 'goal') {
        await interaction.deferUpdate();
        // One control now carries both halves of the goal: 'F', 'B', or 'P' with the pull number appended ('P7'). Encoding the value INTO the option is what let the target-pull modal field go away.
        const raw = interaction.values[0];
        const next = raw.startsWith('P')
            ? { ...state, target: 'P', targetValue: Number(raw.slice(1)) || 1 }
            : { ...state, target: raw, targetValue: raw === 'B' ? state.targetValue : 0 };
        await renderPanel(interaction, next);
        return true;
    }

    if (interaction.isStringSelectMenu() && state.verb === 'ent') {
        await interaction.deferUpdate();
        const mask = interaction.values.reduce((m, id) => {
            const i = CP_PACKAGES.findIndex(p => p.id === id);
            return i === -1 ? m : m | (1 << i);
        }, 0);
        await renderPanel(interaction, { ...state, entitlementMask: mask });
        return true;
    }

    if (interaction.isButton() && state.verb === 'upg') {
        await interaction.deferUpdate();
        await renderPanel(interaction, { ...state, includeUpgrades: !state.includeUpgrades });
        return true;
    }

    // Progressive-disclosure toggle (2026-08-26 13:19 EDT) -- same shape as 'upg', flips one boolean and re-renders.
    if (interaction.isButton() && state.verb === 'detail') {
        await interaction.deferUpdate();
        await renderPanel(interaction, { ...state, detail: !state.detail });
        return true;
    }

    if (interaction.isButton() && state.verb === 'region') {
        await interaction.deferUpdate();
        await renderPanel(interaction, state); // customId's own region field IS the target region
        return true;
    }

    return false;
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleDrawCalcInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    const handled = await route(interaction);
    return handled !== false;
}

module.exports = { handleDrawCalcInteraction, OWNED_PREFIXES };
