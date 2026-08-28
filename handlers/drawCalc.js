// ==========================================
// /draw calculator -- INTERACTION HANDLER
// ==========================================
// Owns every calc~ interaction. Serves buttons, string selects and modal submits -- every branch type-tests as well as prefix-tests (see .claude/rules/interaction-router.md).
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S. handleDrawCalcInteraction is awaited from inside handlers/router.js's single top-level try/catch -- do not add one here, do not register listeners, and keep every error-branch reply an AWAITED call in its own small try/catch.
//
// 🔴 EVERY BRANCH THAT TOUCHES A BASKET GOES THROUGH THE STORE, AND EVERY LOAD CAN COME BACK NULL. The old single-draw panel recomputed everything from the customId alone and could never go stale; this one persists to Mongo, so a basket can be deleted, expire, or belong to someone else's forged id by the time a click lands. `loadOwned()` below is the one place that happens, and every branch routes through it before touching `basket.*`.
const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { sendV2Payload } = require('../utils/sendV2Payload');
const { withShareButton } = require('../utils/shareButton');
const { getAccentColorForCommand } = require('../utils/accentColor');
const UserPreference = require('../models/UserPreference');
const {
    decodeState, encodeState, clampFocus, buildCalculatorPanel, buildDrawInfoPanel, buildHelpPanel,
    findLiveDoubleCPEntry
} = require('../commands/drawCalculator');
const { PRESET_ACCENT, REGION_ORDER } = require('../commands/drawprices');
const { CP_PACKAGES } = require('../utils/cpPackages');
const basketStore = require('../utils/drawBasketStore');
const { resolvePanelActor } = require('../utils/interactionContext');

const OWNED_PREFIXES = ['calc~'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && customId.startsWith('calc~');
}

function parseAmount(raw) {
    if (!raw) return 0;
    const cleaned = String(raw).trim().toLowerCase().replace(/[, ]/g, '');
    if (cleaned === '') return 0;
    const k = cleaned.endsWith('k');
    const n = Number(k ? cleaned.slice(0, -1) : cleaned);
    if (!Number.isFinite(n) || n < 0) return null;
    return Math.floor(k ? n * 1000 : n);
}

function buildAmountModal(state) {
    const field = new TextInputBuilder().setCustomId('amount').setLabel('CP you already have')
        .setStyle(TextInputStyle.Short).setPlaceholder('e.g. 3,000 or 3k').setRequired(false);
    return new ModalBuilder()
        .setCustomId(encodeState('nums', state))
        .setTitle('Your CP Balance')
        .addComponents(new ActionRowBuilder().addComponents(field));
}

function buildNameModal(state, currentName) {
    const field = new TextInputBuilder().setCustomId('name').setLabel('Calculation name')
        .setStyle(TextInputStyle.Short).setPlaceholder('e.g. Season 12 push')
        .setValue(currentName || '').setRequired(false).setMaxLength(80);
    return new ModalBuilder()
        .setCustomId(encodeState('nums_name', state))
        .setTitle('Name This Calculation')
        .addComponents(new ActionRowBuilder().addComponents(field));
}

async function renderPanel(interaction, state, basket, notice = null) {
    const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
    const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
    const liveDoubleCPEntry = await findLiveDoubleCPEntry();
    const isEphemeral = Boolean(interaction.message?.flags?.has?.(64));
    const savedBaskets = basket ? null : await basketStore.listForUser(interaction.user.id);
    const panel = buildCalculatorPanel(state, basket, accentColor, {
        liveDoubleCPEntry,
        currency: prefs?.cpCurrency || 'USD',
        client: interaction.client,
        savedBaskets,
        notice
    });
    // `panel` is already the top-level component LIST (Container + the sibling nav row) -- do not wrap it in another array.
    return sendV2Payload(interaction, withShareButton(panel, isEphemeral), { skipExpiry: true });
}

// Deferred here, once, so every branch below can just call renderPanel -- 🔴 loadOwned() must be called AFTER this so a not-found/wrong-owner message can still be sent as an edit, not a second reply on top of an unacknowledged interaction.
async function ackUpdate(interaction) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
}

// The one place every basket-touching branch resolves ownership AND existence. Returns the basket document, or null after already sending a "gone" panel -- callers just `if (!basket) return true;`.
async function loadOwned(interaction, state, actingUserId) {
    // An ABSENT basketId (the /draw prices cross-link, or a customId built before any basket existed) is treated identically to a lookup that came back empty -- both need the landing panel actually rendered, not a silent no-op that leaves Discord's own click spinner hanging.
    const basket = state.basketId ? await basketStore.load(actingUserId, state.basketId) : null;
    if (!basket) {
        await renderPanel(interaction, { ...state, basketId: null, page: 0 }, null);
    }
    return basket;
}

async function route(interaction) {
    const state = decodeState(interaction.customId);

    // Author lock via resolvePanelActor -- never a bare id comparison. This panel has no "view someone else's" mode the way /colors does; a non-owner is refused outright, and the admin override lets Harkirat act as the ORIGINAL author (never his own id) on any branch.
    const actingUser = state.authorId ? await resolvePanelActor(interaction, state.authorId) : interaction.user;
    if (!actingUser) {
        try {
            await interaction.reply({ content: "🔒 **That isn't your calculator!** Run `/draw calculator` to start your own.", ephemeral: true });
        } catch (notifyError) { console.error('Failed to notify user of blocked calculator action (interaction likely expired):', notifyError); }
        return true;
    }
    const actingUserId = actingUser.id;

    // showModal() must be the DIRECT response to the button -- cannot follow a deferReply/deferUpdate.
    if (interaction.isButton() && state.verb === 'modal') {
        return await interaction.showModal(buildAmountModal(state));
    }
    if (interaction.isButton() && state.verb === 'modal_name') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        return await interaction.showModal(buildNameModal(state, basket.name));
    }

    if (interaction.isModalSubmit() && state.verb === 'nums') {
        const amount = parseAmount(interaction.fields.getTextInputValue('amount'));
        if (amount === null) {
            try { await interaction.reply({ content: '❌ That amount was not understood — try a plain number like `3000` or `3k`.', ephemeral: true }); }
            catch (notifyError) { console.error('Failed to notify user of invalid amount (interaction likely expired):', notifyError); }
            return true;
        }
        await interaction.deferUpdate();
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const updated = await basketStore.save(actingUserId, { _id: state.basketId, balance: amount });
        await renderPanel(interaction, state, updated);
        return true;
    }

    if (interaction.isModalSubmit() && state.verb === 'nums_name') {
        const name = interaction.fields.getTextInputValue('name');
        await interaction.deferUpdate();
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const updated = await basketStore.rename(actingUserId, state.basketId, name);
        await renderPanel(interaction, state, updated);
        return true;
    }

    // Draw Info / Help open as their OWN ephemeral messages, own fresh 40-component budget each (spec §3) -- deferReply (never deferUpdate) starts a genuinely NEW response chain on this same interaction, so the sendV2Payload call below patches THAT message's @original, not the live panel's. Handled here, before the generic ack, because deferReply/deferUpdate are each only valid once per interaction -- this branch cannot fall through the generic defer below.
    if (interaction.isButton() && (state.verb === 'info' || state.verb === 'help')) {
        const prefs = await UserPreference.findOne({ discordId: actingUserId });
        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        let panel;
        if (state.verb === 'info') {
            const basket = state.basketId ? await basketStore.load(actingUserId, state.basketId) : null;
            panel = buildDrawInfoPanel(basket || { banners: [], region: 'region_10' }, accentColor);
        } else {
            panel = buildHelpPanel(accentColor);
        }
        try {
            await interaction.deferReply({ flags: 64 });
            await sendV2Payload(interaction, [panel], { skipExpiry: true });
        } catch (notifyError) { console.error('Failed to send Draw Info/Help panel (interaction likely expired):', notifyError); }
        return true;
    }

    // Everything below edits @original -- defer up front.
    await ackUpdate(interaction);

    if (interaction.isStringSelectMenu() && state.verb === 'draws') {
        if (!state.basketId) {
            // 🔴 The setup form's picker is a MULTI-select, so a first pick can carry SEVERAL draws -- create one line per selected value. Reading only `values[0]` here (what the retired single-pick landing did) would silently drop every draw after the first: a wrong result that looks like a working one.
            const prefs = await UserPreference.findOne({ discordId: actingUserId });
            let region = 'region_10';
            if (prefs?.defaultRegionMode && prefs.defaultRegionMode !== 'last_viewed') region = prefs.defaultRegionMode;
            else if (prefs?.defaultRegion) region = prefs.defaultRegion;
            const created = await basketStore.save(actingUserId, {
                banners: interaction.values.map(drawKey => ({ drawKey, pullsDone: 0 })),
                region
            });
            await renderPanel(interaction, { ...state, basketId: String(created._id), page: 0 }, created);
            return true;
        }
        // Page 0's multi-select: the FULL current selection is `interaction.values` -- diff against the types already present. New types append one fresh banner; a type dropped from the selection removes EVERY banner of that type.
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const selected = new Set(interaction.values);
        const present = new Set(basket.banners.map(b => b.drawKey));
        let banners = basket.banners.filter(b => selected.has(b.drawKey));
        for (const key of selected) if (!present.has(key)) banners.push({ drawKey: key, pullsDone: 0 });
        const updated = await basketStore.save(actingUserId, { _id: state.basketId, banners });
        await renderPanel(interaction, state, updated);
        return true;
    }

    if (interaction.isStringSelectMenu() && state.verb === 'addmore') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const updated = await basketStore.save(actingUserId, { _id: state.basketId, banners: [...basket.banners, { drawKey: interaction.values[0], pullsDone: 0 }] });
        await renderPanel(interaction, state, updated);
        return true;
    }

    if (interaction.isStringSelectMenu() && state.verb === 'bpulls') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const index = state.focus;
        if (index === null || !basket.banners[index]) { await renderPanel(interaction, state, basket); return true; }
        const banners = basket.banners.map((b, i) => i === index ? { ...b, pullsDone: Number(interaction.values[0]) || 0 } : b);
        const updated = await basketStore.save(actingUserId, { _id: state.basketId, banners });
        await renderPanel(interaction, { ...state, focus: null }, updated);
        return true;
    }

    if (interaction.isStringSelectMenu() && state.verb === 'setfocus') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        await renderPanel(interaction, { ...state, focus: clampFocus(Number(interaction.values[0]) || 0, basket.banners.length) }, basket);
        return true;
    }

    if (interaction.isStringSelectMenu() && state.verb === 'ent') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const mask = interaction.values.reduce((m, id) => {
            const i = CP_PACKAGES.findIndex(p => p.id === id);
            return i === -1 ? m : m | (1 << i);
        }, 0);
        const updated = await basketStore.save(actingUserId, { _id: state.basketId, entitlementMask: mask });
        await renderPanel(interaction, state, updated);
        return true;
    }

    if (interaction.isStringSelectMenu() && state.verb === 'load') {
        await renderPanel(interaction, { ...state, basketId: interaction.values[0], page: 0, focus: null, bpage: 0 },
            await basketStore.load(actingUserId, interaction.values[0]));
        return true;
    }

    if (interaction.isButton() && (state.verb === 'up' || state.verb === 'down')) {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const i = state.focus;
        const j = state.verb === 'up' ? i - 1 : i + 1;
        if (i === null || j < 0 || j >= basket.banners.length) { await renderPanel(interaction, state, basket); return true; }
        const banners = [...basket.banners];
        [banners[i], banners[j]] = [banners[j], banners[i]];
        const updated = await basketStore.save(actingUserId, { _id: state.basketId, banners });
        await renderPanel(interaction, { ...state, focus: j }, updated);
        return true;
    }

    if (interaction.isButton() && (state.verb === 'page' || state.verb === 'bpage')) {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        await renderPanel(interaction, state, basket);
        return true;
    }

    if (interaction.isButton() && state.verb === 'region') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        // Region switching preserves every banner untouched -- only `region` changes (spec §9).
        const region = state.targetRegion && REGION_ORDER.includes(state.targetRegion) ? state.targetRegion : basket.region;
        const updated = await basketStore.save(actingUserId, { _id: state.basketId, region });
        await renderPanel(interaction, { ...state, targetRegion: null }, updated);
        return true;
    }

    if (interaction.isButton() && state.verb === 'upg') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const updated = await basketStore.save(actingUserId, { _id: state.basketId, includeUpgrades: !basket.includeUpgrades });
        await renderPanel(interaction, state, updated);
        return true;
    }

    // Calculate: the one transition from draft to result. Deliberately NOT two-step -- it is not destructive, and New Calculation is right there to go back. Refuses an empty calculation rather than submitting one that would immediately bounce back to the form (the button is also rendered disabled in that state).
    if (interaction.isButton() && state.verb === 'submit') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        if (!basket.banners.length) { await renderPanel(interaction, state, basket); return true; }
        const updated = await basketStore.save(actingUserId, { _id: state.basketId, submitted: true });
        await renderPanel(interaction, { ...state, page: 0, bpage: 0, focus: null }, updated);
        return true;
    }

    if (interaction.isButton() && state.verb === 'detail') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        await renderPanel(interaction, { ...state, detail: !state.detail }, basket);
        return true;
    }

    // Delete is two-step: the first click only re-renders with the armed (Danger-style) button.
    if (interaction.isButton() && state.verb === 'delarm') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        await renderPanel(interaction, { ...state, verb: 'delarm' }, basket);
        return true;
    }
    if (interaction.isButton() && state.verb === 'del') {
        await basketStore.remove(actingUserId, state.basketId);
        await renderPanel(interaction, { ...state, basketId: null, page: 0, verb: 'landing' }, null);
        return true;
    }

    // New Calculation (verb still `reset`) is also two-step. Clears the contents, the transient view state (spec §9) AND the submitted flag -- but never the basket document or its name, which is what makes it recoverable-by-mistake in a way Delete deliberately is not.
    if (interaction.isButton() && state.verb === 'resetarm') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        await renderPanel(interaction, { ...state, verb: 'resetarm' }, basket);
        return true;
    }
    if (interaction.isButton() && state.verb === 'reset') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        // `submitted: false` is what makes this "New Calculation" rather than "empty result" -- it returns the panel to the setup form, which is what the button now says it does.
        const updated = await basketStore.save(actingUserId, { _id: state.basketId, banners: [], balance: 0, submitted: false });
        await renderPanel(interaction, { ...state, page: 0, focus: null, bpage: 0, detail: false, verb: 'landing' }, updated);
        return true;
    }

    return false;
}

async function handleDrawCalcInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    const handled = await route(interaction);
    return handled !== false;
}

module.exports = { handleDrawCalcInteraction, OWNED_PREFIXES };
