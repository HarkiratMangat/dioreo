// ==========================================
// /draw calculator -- INTERACTION HANDLER
// ==========================================
// Owns every calc~ interaction. Serves THREE interaction types -- buttons, string selects and modal
// submits -- so EVERY branch type-tests as well as prefix-tests. Skipping that is the exact defect
// that broke /settings pagination during the index.js split (see .claude/rules/interaction-router.md):
// two branches with byte-identical customId prefixes but different types, where the first swallowed
// the second.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleDrawCalcInteraction is awaited from
// inside handlers/router.js's single top-level try/catch -- do not add one here, do not register
// listeners, and keep every error-branch reply an AWAITED call in its own small try/catch.
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { withShareButton } = require('../utils/shareButton');
const { buildGlobalNavRow } = require('../utils/globalNav');
const { getAccentColorForCommand } = require('../utils/accentColor');
const UserPreference = require('../models/UserPreference');
const {
    decodeState, encodeState, buildSetupPanel, buildResultsPanel, findLiveDoubleCPEntry
} = require('../commands/drawCalculator');
const { DRAW_META, PRESET_ACCENT } = require('../commands/drawprices');
const { pullCount } = require('../utils/drawCost');
const { CP_PACKAGES } = require('../utils/cpPackages');

const OWNED_PREFIXES = ['calc~'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && customId.startsWith('calc~');
}

// Players type "3,000", "3000" and "3k" interchangeably. Rejecting two of those would read as the
// calculator being broken rather than strict. Returns null for genuinely invalid input so the
// caller can show a validation message instead of silently treating it as zero.
function parseAmount(raw) {
    if (!raw) return 0;
    const cleaned = String(raw).trim().toLowerCase().replace(/[, ]/g, '');
    if (cleaned === '') return 0;
    const k = cleaned.endsWith('k');
    const n = Number(k ? cleaned.slice(0, -1) : cleaned);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.floor(k ? n * 1000 : n);
}

function buildNumbersModal(state) {
    const total = pullCount(state.region, state.drawKey);
    const modal = new ModalBuilder().setCustomId(encodeState('nums', state)).setTitle('Enter Your Numbers');
    const fields = [
        new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('pulls_done').setLabel(`Pulls already done (0-${total})`)
                .setStyle(TextInputStyle.Short).setValue(String(state.pullsDone)).setRequired(true)
        )
    ];
    // Budget mode ('B') asks "how far does spending X more CP get me" -- it has no use for an
    // existing balance (design decision 10's own framing is the new spend amount alone), so the
    // field is skipped rather than collected and silently discarded. F/P modes DO use it (see
    // buildResultsPanel's shortfall = totalNeeded - state.balance).
    if (state.target !== 'B') {
        fields.push(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('balance').setLabel('Current CP balance')
                .setStyle(TextInputStyle.Short).setPlaceholder('e.g. 3,000 or 3k').setValue(state.balance ? String(state.balance) : '').setRequired(false)
        ));
    }
    if (state.target !== 'F') {
        fields.push(new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('target_value').setLabel(state.target === 'P' ? `Target pull number (1-${total})` : 'Budget to spend (CP)')
                .setStyle(TextInputStyle.Short).setPlaceholder(state.target === 'P' ? 'e.g. 9' : 'e.g. 5,000 or 5k').setValue(state.targetValue ? String(state.targetValue) : '').setRequired(true)
        ));
    }
    modal.addComponents(...fields);
    return modal;
}

async function renderSetup(interaction, state) {
    const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
    const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
    const liveDoubleCPEntry = await findLiveDoubleCPEntry();
    const isEphemeral = Boolean(interaction.message?.flags?.has?.(64));
    const panel = buildSetupPanel(state, accentColor, { liveDoubleCPEntry });
    const nav = buildGlobalNavRow('nav_prices');
    return sendV2Payload(interaction, withShareButton([panel, nav], isEphemeral));
}

async function renderResults(interaction, state) {
    const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
    const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
    const currency = prefs?.cpCurrency || 'USD';
    const isEphemeral = Boolean(interaction.message?.flags?.has?.(64));
    const panel = buildResultsPanel(state, accentColor, { currency, client: interaction.client });
    const nav = buildGlobalNavRow('nav_prices');
    return sendV2Payload(interaction, withShareButton([panel, nav], isEphemeral));
}

async function route(interaction) {
    const customId = interaction.customId;
    const state = decodeState(customId);

    // showModal() must be the DIRECT response to the button -- it cannot follow a deferReply or
    // deferUpdate. Same constraint documented in handlers/autobuild.js.
    if (interaction.isButton() && state.verb === 'modal') {
        return await interaction.showModal(buildNumbersModal(state));
    }

    if (interaction.isModalSubmit() && state.verb === 'nums') {
        const total = pullCount(state.region, state.drawKey);
        const pullsDoneRaw = parseAmount(interaction.fields.getTextInputValue('pulls_done'));
        if (pullsDoneRaw === null || pullsDoneRaw > total) {
            try {
                await interaction.reply({ content: `❌ Pulls done must be a number from 0 to ${total} for **${DRAW_META[state.drawKey].name}** -- it doesn't have a 10th pull if that's not what you meant.`, ephemeral: true });
            } catch (notifyError) { console.error('Failed to notify user of invalid pullsDone (interaction likely expired):', notifyError); }
            return true;
        }
        // 'balance' isn't on the modal at all in budget mode (buildNumbersModal skips it -- see that
        // function's own comment) -- getTextInputValue() throws on a field that doesn't exist, so
        // this must match the modal's own conditional exactly, not just default missing to 0.
        const balanceRaw = state.target === 'B' ? 0 : parseAmount(interaction.fields.getTextInputValue('balance'));
        let targetValueRaw = state.targetValue;
        if (state.target !== 'F') {
            targetValueRaw = parseAmount(interaction.fields.getTextInputValue('target_value'));
            if (targetValueRaw === null) {
                try {
                    await interaction.reply({ content: `❌ That target value wasn't understood -- try a plain number like \`3000\` or \`3k\`.`, ephemeral: true });
                } catch (notifyError) { console.error('Failed to notify user of invalid target value (interaction likely expired):', notifyError); }
                return true;
            }
        }
        await interaction.deferUpdate();
        const newState = { ...state, pullsDone: pullsDoneRaw, balance: balanceRaw === null ? 0 : balanceRaw, targetValue: targetValueRaw };
        await renderSetup(interaction, newState);
        return true;
    }

    if (interaction.isStringSelectMenu() && state.verb === 'draw') {
        await interaction.deferUpdate();
        await renderSetup(interaction, { ...state, drawKey: interaction.values[0], includeUpgrades: false });
        return true;
    }

    if (interaction.isStringSelectMenu() && state.verb === 'target') {
        await interaction.deferUpdate();
        await renderSetup(interaction, { ...state, target: interaction.values[0] });
        return true;
    }

    if (interaction.isStringSelectMenu() && state.verb === 'ent') {
        await interaction.deferUpdate();
        const mask = interaction.values.reduce((m, id) => {
            const i = CP_PACKAGES.findIndex(p => p.id === id);
            return i === -1 ? m : m | (1 << i);
        }, 0);
        await renderSetup(interaction, { ...state, entitlementMask: mask });
        return true;
    }

    if (interaction.isButton() && state.verb === 'upg') {
        await interaction.deferUpdate();
        await renderSetup(interaction, { ...state, includeUpgrades: !state.includeUpgrades });
        return true;
    }

    if (interaction.isButton() && state.verb === 'run') {
        await interaction.deferUpdate();
        await renderResults(interaction, state);
        return true;
    }

    if (interaction.isButton() && state.verb === 'region') {
        await interaction.deferUpdate();
        await renderResults(interaction, state); // customId's own region field IS the target region
        return true;
    }

    if (interaction.isButton() && state.verb === 'edit') {
        await interaction.deferUpdate();
        await renderSetup(interaction, state);
        return true;
    }

    return false;
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise --
// the uniform contract every handlers/*.js module follows.
async function handleDrawCalcInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    const handled = await route(interaction);
    return handled !== false;
}

module.exports = { handleDrawCalcInteraction, OWNED_PREFIXES };
