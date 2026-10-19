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
const { getAccentColorForCommand } = require('../utils/accentColor');
const UserPreference = require('../models/UserPreference');
const {
    decodeState, encodeState, clampFocus, buildCalculatorPanel, buildDrawInfoPanel, buildHelpPanel,
    findLiveDoubleCPEntry, buildExportText, readBalanceFields, applySelection, setTypeCount, MAX_LINES, MAX_SAVED, shortName, savedChecksum,
    buildUpgradeModal, readUpgradeModal, buildSpinsInModal, readSpinsIn, CALC_KEYS, listSeasonDraws, freshLine, unitOf, lineName,
    buildAddDrawsModal, buildRemoveModal, readRemovePicks, buildRegionBalanceModal, calcCurrency, buildGoalModal, readGoal
} = require('../commands/drawCalculator');
const { pullCount, upgradeKeyOf, isArmoryKey, armorySize } = require('../utils/drawCost');
const { PRESET_ACCENT, REGION_ORDER } = require('../commands/drawprices');
const { CP_PACKAGES, CURRENCIES } = require('../utils/cpPackages');
const basketStore = require('../utils/drawBasketStore');
const { resolvePanelActor } = require('../utils/interactionContext');

const OWNED_PREFIXES = ['calc~'];

const { DRAW_META } = require('../commands/drawprices');
// The draws a calculation can hold, in the untick confirm's mask bit order (the three Series Armories after the nine draws since 2026-10-18 12:16 EDT).
const DRAW_KEY_ORDER = CALC_KEYS;
// The calculator's one name per draw (commands/drawCalculator.js SHORT_NAME), never DRAW_META's full "... Draw" name.
function DRAW_META_NAMES(key) { return shortName(key); }


function ownsCustomId(customId) {
    return typeof customId === 'string' && customId.startsWith('calc~');
}


// Mythic Cards and Coins join the balance (2026-10-17 12:01 EDT, Harkirat: "we need to include mythic cards and mythic coins within the 'Balance' modal pop-up"), always shown (2026-10-17 18:54 EDT, his: "this way its ready incase they want to pivot over to that calculation. The balances shouldnt be restricted to *if* a mythic wep/char draw is selected"). Every field is pre-filled with what is set, because a blank field means 0: without the pre-fill, changing only the cards would wipe the CP.
function buildAmountModal(state, basket) {
    const field = (id, label, placeholder, value) => {
        const input = new TextInputBuilder().setCustomId(id).setLabel(label).setStyle(TextInputStyle.Short).setPlaceholder(placeholder).setRequired(false);
        if (value) input.setValue(String(value));
        return new ActionRowBuilder().addComponents(input);
    };
    const rows = [field('amount', 'CP you already have', 'e.g. 3,000 or 3k', basket?.balance)];
    rows.push(field('cards', 'Mythic Cards you hold', 'e.g. 300 or 2k', basket?.mythicCards));
    rows.push(field('coins', 'Mythic Coins you hold', 'e.g. 300 or 2k', basket?.mythicCoins));
    return new ModalBuilder().setCustomId(encodeState('nums', state)).setTitle('Your Balance').addComponents(...rows);
}

function buildNameModal(state, currentName) {
    // The 80-character limit is named in the label and the example is his (2026-10-16 14:31 EDT: "is there a character limit to the calc name? if yes, mention it in the pop-up modal? and change the placeholder there to 'e.g. Purchase spree'").
    const field = new TextInputBuilder().setCustomId('name').setLabel('Calculation name (up to 80 characters)')
        .setStyle(TextInputStyle.Short).setPlaceholder('e.g. Purchase spree')
        .setValue(currentName || '').setRequired(false).setMaxLength(80);
    return new ModalBuilder()
        .setCustomId(encodeState('nums_name', state))
        .setTitle('Name This Calculation')
        .addComponents(new ActionRowBuilder().addComponents(field));
}

async function renderPanel(interaction, state, basket, notice = null, dropConfirm = null, savedConfirm = null, overwriteConfirm = null) {
    const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
    const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
    const liveDoubleCPEntry = await findLiveDoubleCPEntry();
    const isEphemeral = Boolean(interaction.message?.flags?.has?.(64));
    // Listed on every render: the Saved view needs the list and every other view shows its count on the nav's Saved button.
    const savedBaskets = await basketStore.listForUser(interaction.user.id);
    // A working copy shows which saved calculation it came from; read live, so a renamed or deleted source never shows a stale name.
    if (basket && !basket.name && basket.sourceId) {
        const source = await basketStore.load(interaction.user.id, basket.sourceId);
        basket = { ...basket, sourceName: source?.name || null };
    }
    const panel = buildCalculatorPanel(state, basket, accentColor, {
        liveDoubleCPEntry,
        // This season's draws for the form's first dropdown, read on every render so a draw added in /manage shows on the next click.
        seasonDraws: await listSeasonDraws(),
        // The calculation's own currency, else the /settings default (2026-10-18 20:00 EDT).
        currency: calcCurrency(basket, prefs?.cpCurrency || 'USD'),
        timezone: prefs?.timezone || null,
        client: interaction.client,
        savedBaskets,
        notice,
        dropConfirm,
        savedConfirm,
        overwriteConfirm
    });
    // `panel` is already the top-level component LIST (Container + the sibling nav row) -- do not wrap it in another array. No Show Everyone row (2026-10-14 18:34 EDT): Export shares a result instead.
    return sendV2Payload(interaction, panel, { skipExpiry: true });
}

// 🔴 COPY-ON-WRITE FOR SAVED CALCULATIONS (2026-10-14 17:28 EDT, Harkirat: "a saved calc should remain in it's saved state. so that means a user needs to press save and select that previous saved result to override it. otherwise selecting that saved calc again should bring you to it's result"). Every change to a calculation goes through here. On a SAVED one, the first real change opens an unnamed working copy carrying `sourceId`, applies the change there, and points this message at the copy (it mutates `state.basketId`, so every render after it follows); the saved one is untouched until the Save step saves over it. A change that changes nothing (Calculate on an already-calculated one) writes nothing and forks nothing.
async function writeTo(userId, state, basket, fields) {
    // Any change marks the view dirty, so Adjust Draws opened from a result offers Recalculate (2026-10-18 14:57 EDT). The handlers render from this same state object after writing.
    state.dirty = true;
    if (basket && basket.name) {
        if (Object.entries(fields).every(([k, v]) => JSON.stringify(v) === JSON.stringify(basket[k]))) return basket;
        const copy = await basketStore.save(userId, {
            banners: basket.banners, region: basket.region, balance: basket.balance, includeUpgrades: basket.includeUpgrades,
            mythicCards: basket.mythicCards || 0, mythicCoins: basket.mythicCoins || 0, currency: basket.currency || null,
            entitlementMask: basket.entitlementMask, submitted: basket.submitted, sourceId: String(basket._id), ...fields
        });
        state.basketId = String(copy._id);
        return copy;
    }
    return basketStore.save(userId, { _id: state.basketId, ...fields });
}

// The calculation a Saved-view render shows at its top: loaded quietly, since a gone one only drops that section.
async function currentBasket(userId, state) {
    return state.basketId ? basketStore.load(userId, state.basketId) : null;
}

// Deferred here, once, so every branch below can just call renderPanel -- 🔴 loadOwned() must be called AFTER this so a not-found/wrong-owner message can still be sent as an edit, not a second reply on top of an unacknowledged interaction.
async function ackUpdate(interaction) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferUpdate();
}

// The one place every basket-touching branch resolves ownership AND existence. Returns the basket document, or null after already sending a "gone" panel -- callers just `if (!basket) return true;`.
async function loadOwned(interaction, state, actingUserId) {
    // An ABSENT basketId -- /draw prices' "Draw Calculator" link, which cannot know one -- reopens the player's most recent calculation (2026-10-13 12:40 EDT) instead of an empty form, then stops: the clicked control belonged to no calculation, so nothing should be applied to the one that opens. A basketId that resolves to nothing still gets the "no longer exists" form.
    if (!state.basketId) {
        const latest = await basketStore.latestForUser(actingUserId);
        await renderPanel(interaction, { ...state, basketId: latest ? String(latest._id) : null, page: 0 }, latest || null);
        return null;
    }
    const basket = await basketStore.load(actingUserId, state.basketId);
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
        const basket = state.basketId ? await basketStore.load(actingUserId, state.basketId) : null;
        return await interaction.showModal(buildAmountModal(state, basket));
    }
    // SET REGION & BALANCE (2026-10-18 16:17 EDT): the editor's one pop-up for the region and the balances.
    if (interaction.isButton() && state.verb === 'rbmodal') {
        const basket = state.basketId ? await basketStore.load(actingUserId, state.basketId) : null;
        const prefs = await UserPreference.findOne({ discordId: interaction.user.id });
        return await interaction.showModal(buildRegionBalanceModal(state, basket, { defaultCurrency: prefs?.cpCurrency || 'USD' }));
    }
    // The upgrade pop-up (2026-10-17 13:17 EDT): from the one-line button (`upgset`, the line in `f`) or the Mythic-lines dropdown (`upgpick`, the line as its value). A direct response like every showModal, so it comes before the generic defer.
    if ((interaction.isButton() && state.verb === 'upgset') || (interaction.isStringSelectMenu() && state.verb === 'upgpick')) {
        const index = state.verb === 'upgpick' ? Number(interaction.values[0]) : state.focus;
        const basket = state.basketId ? await basketStore.load(actingUserId, state.basketId) : null;
        const modal = basket ? buildUpgradeModal(state, basket, index) : null;
        if (!modal) {
            try { await interaction.reply({ content: 'That draw is no longer in this calculation.', ephemeral: true }); }
            catch (notifyError) { console.error('Failed to notify user of a missing upgrade line (interaction likely expired):', notifyError); }
            return true;
        }
        await interaction.showModal(modal);
        // Discord keeps a dropdown's pick after the pop-up is cancelled, and picking the same draw again sends nothing (2026-10-17 19:19 EDT, Harkirat: "i clicked the #3 option before to adjust it. but i want to click it again/adjust again and I'm unable to do so"). Redrawing the panel right after the pop-up opens clears the pick: Discord accepts an edit of the message after a pop-up response (confirmed in his click-test, 2026-10-17 19:22 EDT).
        if (state.verb === 'upgpick') {
            try { await renderPanel(interaction, state, basket); }
            catch (resetError) { console.warn('upgpick: could not reset the dropdown after the pop-up:', resetError?.code || resetError?.message || resetError); }
        }
        return true;
    }
    // SPINS IN (2026-10-18 12:16 EDT): a Series Armory's spins toward its next item, from the button beside the line on Set Draw Progress.
    if (interaction.isButton() && state.verb === 'spinsin') {
        const basket = state.basketId ? await basketStore.load(actingUserId, state.basketId) : null;
        const modal = basket ? buildSpinsInModal(state, basket, state.focus) : null;
        if (!modal) {
            try { await interaction.reply({ content: 'That armory is no longer in this calculation.', ephemeral: true }); }
            catch (notifyError) { console.error('Failed to notify user of a missing armory line (interaction likely expired):', notifyError); }
            return true;
        }
        return await interaction.showModal(modal);
    }
    // THE GOAL of an Advanced line (2026-10-18 21:51 EDT): its button opens the pop-up, a direct response like every showModal.
    if (interaction.isButton() && state.verb === 'goalset') {
        const basket = state.basketId ? await basketStore.load(actingUserId, state.basketId) : null;
        const modal = basket ? buildGoalModal(state, basket, state.focus) : null;
        if (!modal) {
            try { await interaction.reply({ content: 'That draw is no longer in this calculation.', ephemeral: true }); }
            catch (notifyError) { console.error('Failed to notify user of a missing Advanced line (interaction likely expired):', notifyError); }
            return true;
        }
        return await interaction.showModal(modal);
    }
    if (interaction.isModalSubmit() && state.verb === 'goalsave') {
        await interaction.deferUpdate();
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const index = state.focus;
        const line = index !== null ? basket.banners[index] : null;
        let picked = null;
        try { picked = readGoal(interaction.fields.getStringSelectValues('goal')[0]); } catch { picked = null; }
        if (!line || !buildGoalModal(state, basket, index) || !picked) { await renderPanel(interaction, { ...state, focus: null }, basket, 'That draw is no longer in this calculation, so nothing changed.'); return true; }
        // 'all' is the default, so it is stored as absent.
        const banners = basket.banners.map((b, i) => (i === index ? { ...b, goal: picked === 'all' ? undefined : picked } : b));
        const updated = await writeTo(actingUserId, state, basket, { banners });
        await renderPanel(interaction, { ...state, focus: null }, updated);
        return true;
    }
    // ADD DRAWS and REMOVE (2026-10-18 13:37 EDT, his Mock 2): two pop-ups from the Adjust Draws screen's footer.
    if (interaction.isButton() && (state.verb === 'addopen' || state.verb === 'rmopen')) {
        const basket = state.basketId ? await basketStore.load(actingUserId, state.basketId) : null;
        const modal = !basket ? null : state.verb === 'addopen' ? buildAddDrawsModal(state, basket, await listSeasonDraws()) : buildRemoveModal(state, basket);
        if (!modal) {
            try { await interaction.reply({ content: 'That calculation has nothing to remove.', ephemeral: true }); }
            catch (notifyError) { console.error('Failed to notify user of an empty remove (interaction likely expired):', notifyError); }
            return true;
        }
        return await interaction.showModal(modal);
    }
    if (interaction.isModalSubmit() && (state.verb === 'addsave' || state.verb === 'rmsave')) {
        await interaction.deferUpdate();
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const picks = id => { try { return interaction.fields.getStringSelectValues(id) || []; } catch { return []; } };
        if (state.verb === 'rmsave') {
            const drop = readRemovePicks(basket, picks('lines'));
            if (!drop.size) { await renderPanel(interaction, state, basket, 'Those selections changed since the pop-up opened, so nothing was removed.'); return true; }
            const updated = await writeTo(actingUserId, state, basket, { banners: basket.banners.filter((_, i) => !drop.has(i)) });
            await renderPanel(interaction, { ...state, focus: null, bpage: 0 }, updated, `Removed ${drop.size === 1 ? '1 selection' : `${drop.size} selections`}.`);
            return true;
        }
        const season = await listSeasonDraws();
        let banners = [...basket.banners];
        let skipped = 0;
        for (const d of season.filter(x => picks('season').includes(x.id))) {
            if (banners.length >= MAX_LINES) { skipped++; continue; }
            banners.push({ drawKey: d.drawKey, pullsDone: 0, title: d.title, ...(d.size ? { size: d.size } : {}) });
        }
        for (const key of picks('types').filter(k => CALC_KEYS.includes(k))) {
            if (banners.length >= MAX_LINES) { skipped++; continue; }
            banners = setTypeCount(banners, key, banners.filter(b => b.drawKey === key).length + 1).banners;
        }
        if (banners.length === basket.banners.length) { await renderPanel(interaction, state, basket, skipped ? `A calculation holds up to ${MAX_LINES} lines, so nothing was added.` : 'Nothing was picked, so nothing was added.'); return true; }
        const updated = await writeTo(actingUserId, state, basket, { banners });
        await renderPanel(interaction, state, updated, skipped ? `A calculation holds up to ${MAX_LINES} lines, so ${skipped} ${skipped === 1 ? 'draw was' : 'draws were'} not added.` : null);
        return true;
    }
    if (interaction.isModalSubmit() && state.verb === 'spinsinsave') {
        await interaction.deferUpdate();
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const index = state.focus;
        const line = index !== null ? basket.banners[index] : null;
        if (!line || !isArmoryKey(line.drawKey)) { await renderPanel(interaction, { ...state, focus: null }, basket, 'That armory is no longer in this calculation, so nothing changed.'); return true; }
        let raw = null;
        try { raw = interaction.fields.getTextInputValue('spins'); } catch { raw = null; }
        const spinsIn = readSpinsIn(line.drawKey, raw);
        // Set Up Armory's weapon count (2026-10-18 15:17 EDT): present only on a Legendary armory picked as a draw type. Items collected never exceed it.
        let size = null;
        try { size = Number(interaction.fields.getStringSelectValues('size')[0]) || null; } catch { size = null; }
        if (spinsIn === null) {
            const next = size ? basket.banners.map((b, i) => (i === index ? { ...b, size, pullsDone: Math.min(b.pullsDone || 0, size) } : b)) : null;
            const kept = next ? await writeTo(actingUserId, state, basket, { banners: next }) : basket;
            await renderPanel(interaction, { ...state, focus: null }, kept, `"${String(raw).trim().slice(0, 12)}" wasn't saved as Spins In: use a whole number below the spins one item takes.`);
            return true;
        }
        const banners = basket.banners.map((b, i) => (i === index ? { ...b, spinsIn, ...(size ? { size, pullsDone: Math.min(b.pullsDone || 0, size) } : {}) } : b));
        const updated = await writeTo(actingUserId, state, basket, { banners });
        await renderPanel(interaction, { ...state, focus: null }, updated);
        return true;
    }
    if (interaction.isModalSubmit() && (state.verb === 'upgsavew' || state.verb === 'upgsavec')) {
        await interaction.deferUpdate();
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const index = state.focus;
        const line = index !== null ? basket.banners[index] : null;
        // The line the pop-up was opened for must still be the same kind of Mythic draw; a removed or reordered line is refused rather than given another line's upgrade. A Mythic Weapon armory saves through the Mythic Weapon upgrade (same cards, same ladder).
        if (!line || upgradeKeyOf(line.drawKey) !== (state.verb === 'upgsavew' ? 'mythicWeapon' : 'mythicCharacter')) { await renderPanel(interaction, state, basket, 'That draw is no longer in this calculation, so nothing changed.'); return true; }
        const get = id => { try { return interaction.fields.getStringSelectValues(id)[0] ?? null; } catch { return null; } };
        const total = pullCount(basket.region, line.drawKey, line);
        // The same "complete" the pop-up was built with: an armory's collected weapons can carry an upgrade already.
        const complete = isArmoryKey(line.drawKey) ? (line.pullsDone || 0) > 0 : total !== null && line.pullsDone >= total;
        const read = readUpgradeModal(line.drawKey, complete, get, line);
        const banners = basket.banners.map((b, i) => (i === index ? { ...b, upHave: read.have, upWant: read.want } : b));
        const updated = await writeTo(actingUserId, state, basket, { banners });
        await renderPanel(interaction, { ...state, focus: null }, updated, read.notice);
        return true;
    }
    if (interaction.isButton() && state.verb === 'modal_name') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        return await interaction.showModal(buildNameModal(state, basket.name));
    }
    if (interaction.isModalSubmit() && state.verb === 'nums') {
        // Every field that is fine is saved; a refused one is named in a private warning after the panel updates (readBalanceFields). A field the pop-up did not carry reads null and changes nothing.
        const text = id => { try { return interaction.fields.getTextInputValue(id); } catch { return null; } };
        const { fields, warning } = readBalanceFields({ amount: text('amount'), cards: text('cards'), coins: text('coins') });
        await interaction.deferUpdate();
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        // The region, when the pop-up carried it (Set Region & Balance). A pick outside the known regions changes nothing.
        let region = null;
        try { region = interaction.fields.getStringSelectValues('region')[0] || null; } catch { region = null; }
        if (region && REGION_ORDER.includes(region) && region !== basket.region) fields.region = region;
        // The currency, per calculation (2026-10-18 20:00 EDT). Picking the /settings default stores null, so the calculation keeps following the default if it changes later.
        let cur = null;
        try { cur = interaction.fields.getStringSelectValues('currency')[0] || null; } catch { cur = null; }
        if (cur && CURRENCIES.includes(cur)) {
            const prefs = await UserPreference.findOne({ discordId: actingUserId });
            const want = cur === (prefs?.cpCurrency || 'USD') ? null : cur;
            if ((basket.currency || null) !== want) fields.currency = want;
        }
        const updated = Object.keys(fields).length ? await writeTo(actingUserId, state, basket, fields) : basket;
        await renderPanel(interaction, state, updated);
        if (warning) {
            try { await interaction.followUp({ content: warning, flags: 64 }); }
            catch (notifyError) { console.error('Failed to warn about a refused balance field (interaction likely expired):', notifyError); }
        }
        return true;
    }

    if (interaction.isModalSubmit() && state.verb === 'nums_name') {
        const name = interaction.fields.getTextInputValue('name');
        await interaction.deferUpdate();
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        // At the cap, Save refuses and says what to do; it never evicts a calculation he named (2026-10-14 13:13 EDT). Renaming one that is already saved is not a new save.
        if (!basket.name && String(name || '').trim() && (await basketStore.listForUser(actingUserId)).length >= MAX_SAVED) {
            await renderPanel(interaction, state, basket, `You have ${MAX_SAVED} saved calculations, the most it keeps. Delete one in **Saved** to save this one.`);
            return true;
        }
        const updated = await basketStore.rename(actingUserId, state.basketId, name);
        // "Save as New" from the Save step lands on the result it just saved (2026-10-14 17:28 EDT); a rename from the Saved view stays there. Saving an unsaved calculation lands on its result; renaming one that was already saved stays where it was (the Save step folded into the Saved view, 2026-10-16).
        if (!basket.name && updated?.name) { await renderPanel(interaction, { ...state, page: 0, verb: 'load' }, updated, `Saved as "${updated.name}".`); return true; }
        await renderPanel(interaction, state, updated);
        return true;
    }

    // Draw Info / Help open as their OWN ephemeral messages, own fresh 40-component budget each (spec §3) -- deferReply (never deferUpdate) starts a genuinely NEW response chain on this same interaction, so the sendV2Payload call below patches THAT message's @original, not the live panel's. Handled here, before the generic ack, because deferReply/deferUpdate are each only valid once per interaction -- this branch cannot fall through the generic defer below. Export answers privately with the result as copyable markdown (2026-10-14 18:23 EDT); a new reply, never an edit of the panel, so it is handled before the generic defer below.
    if (interaction.isButton() && state.verb === 'export') {
        try {
            await interaction.deferReply({ flags: 64 });
            const basket = state.basketId ? await basketStore.load(actingUserId, state.basketId) : null;
            if (!basket || !basket.banners.length) { await interaction.editReply({ content: 'That calculation no longer exists, so there is nothing to export.' }); return true; }
            const prefs = await UserPreference.findOne({ discordId: actingUserId });
            await interaction.editReply({ content: `Copy the block below and paste it anywhere in Discord:\n\`\`\`md\n${buildExportText(basket, calcCurrency(basket, prefs?.cpCurrency || 'USD'))}\n\`\`\`` });
        } catch (notifyError) { console.error('Failed to send the calculator export (interaction likely expired):', notifyError); }
        return true;
    }

    if (interaction.isButton() && (state.verb === 'info' || state.verb === 'help')) {
        const prefs = await UserPreference.findOne({ discordId: actingUserId });
        const accentColor = await getAccentColorForCommand(interaction, prefs, PRESET_ACCENT);
        let panel;
        if (state.verb === 'info') {
            const basket = state.basketId ? await basketStore.load(actingUserId, state.basketId) : null;
            // Legacy: only panels posted before the Draw Info button left the nav row (15b49b09) can send `info`. Kept until the code-housekeeping session decides on deletion; see buildDrawInfoPanel's comment.
            panel = buildDrawInfoPanel(basket || { banners: [], region: 'region_10' }, accentColor);
        } else {
            // Help draws its price ladder from the open calculation's region and first draw (2026-10-14 18:33 EDT), so it shows the player their own numbers.
            const open = state.basketId ? await basketStore.load(actingUserId, state.basketId) : null;
            panel = buildHelpPanel(accentColor, { region: open?.region || 'region_10', drawKey: open?.banners?.[0]?.drawKey || 'mythicWeapon', currency: calcCurrency(open, prefs?.cpCurrency || 'USD'), client: interaction.client });
        }
        try {
            await interaction.deferReply({ flags: 64 });
            await sendV2Payload(interaction, [panel], { skipExpiry: true });
        } catch (notifyError) { console.error('Failed to send Draw Info/Help panel (interaction likely expired):', notifyError); }
        return true;
    }

    // Draw Prices opens /draw prices as its OWN private message (2026-10-13 12:40 EDT), priced at this calculation's region -- the same shape as Draw Info beside it. It used to be the global nav's `nav_prices`, which replaced the calculator with /draw prices in place. drawprices' execute() sees an already-deferred, non-slash interaction, so it neither re-defers nor reads slash options, and its sendV2Payload patches this new message.
    if (interaction.isButton() && state.verb === 'prices') {
        try {
            await interaction.deferReply({ flags: 64 });
            const basket = state.basketId ? await basketStore.load(actingUserId, state.basketId) : null;
            const drawPrices = interaction.client.commands.get('draw');
            await drawPrices.execute(interaction, basket?.region || null, 0);
        } catch (notifyError) { console.error('Failed to open Draw Prices from the calculator (interaction likely expired):', notifyError); }
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
                banners: interaction.values.filter(key => CALC_KEYS.includes(key)).map(freshLine),
                region
            });
            await renderPanel(interaction, { ...state, basketId: String(created._id), page: 0 }, created);
            return true;
        }
        // Page 0's multi-select: the FULL current selection is `interaction.values` -- diff against the types already present. New types append one fresh banner; a type dropped from the selection removes EVERY banner of that type.
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const selected = new Set(interaction.values);
        // 🔴 Unticking a draw removes EVERY line of it. When that would throw away entered progress, ask first (2026-10-13 12:40 EDT) -- it used to happen on one untick with no confirm and no undo. The requested selection rides in `mask` on the confirm button. The message counts EVERY line that goes, not only the ones with pulls (2026-10-13 13:43 EDT, found in his live click-test): unticking Reactive Legendary with two lines, one at 3/10, said "Remove 1 line with progress" while it removed both.
        const removing = basket.banners.filter(b => !selected.has(b.drawKey));
        const losing = removing.filter(b => b.pullsDone > 0);
        if (losing.length) {
            const mask = [...selected].reduce((m, key) => { const i = DRAW_KEY_ORDER.indexOf(key); return i === -1 ? m : m | (1 << i); }, 0);
            const names = [...new Set(removing.map(b => DRAW_META_NAMES(b.drawKey)))].join(', ');
            const lines = n => `${n} line${n === 1 ? '' : 's'}`;
            await renderPanel(interaction, state, basket, `⚠️ Unticking removes ${lines(removing.length)} of ${names}, ${losing.length === removing.length ? (removing.length === 1 ? 'which has' : 'all with') : `${losing.length} with`} pulls already entered. Remove ${removing.length === 1 ? 'it' : 'them'}?`, { mask, count: removing.length });
            return true;
        }
        const updated = await writeTo(actingUserId, state, basket, { banners: applySelection(basket.banners, selected) });
        await renderPanel(interaction, state, updated);
        return true;
    }

    // THIS SEASON'S DRAWS (2026-10-18 12:16 EDT): each picked draw adds one line named for it, priced as its Draw Type, an armory at its own item count. The list is read again here rather than trusted from the click, so a draw removed since the panel drew is skipped.
    if (interaction.isStringSelectMenu() && state.verb === 'season') {
        const list = await listSeasonDraws();
        const picked = list.filter(d => interaction.values.includes(d.id));
        const lines = picked.map(d => ({ drawKey: d.drawKey, pullsDone: 0, title: d.title, ...(d.size ? { size: d.size } : {}) }));
        const gone = interaction.values.length - picked.length;
        if (!state.basketId) {
            const prefs = await UserPreference.findOne({ discordId: actingUserId });
            let region = 'region_10';
            if (prefs?.defaultRegionMode && prefs.defaultRegionMode !== 'last_viewed') region = prefs.defaultRegionMode;
            else if (prefs?.defaultRegion) region = prefs.defaultRegion;
            const created = await basketStore.save(actingUserId, { banners: lines.slice(0, MAX_LINES), region });
            await renderPanel(interaction, { ...state, basketId: String(created._id), page: 0 }, created, gone ? 'A draw you picked is no longer listed, so it was left out.' : null);
            return true;
        }
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const room = Math.max(0, MAX_LINES - basket.banners.length);
        const updated = await writeTo(actingUserId, state, basket, { banners: [...basket.banners, ...lines.slice(0, room)] });
        const notes = [];
        if (lines.length > room) notes.push(`A calculation holds up to ${MAX_LINES} lines, so ${lines.length - room} ${lines.length - room === 1 ? 'draw was' : 'draws were'} not added.`);
        if (gone) notes.push('A draw you picked is no longer listed, so it was left out.');
        await renderPanel(interaction, state, updated, notes.join(' ') || null);
        return true;
    }

    // SET DRAW PROGRESS (2026-10-18 12:16 EDT): a view (page 5) of the same calculation; Back returns to the form it came from (Edit's page 2 for a result, the draft form otherwise).
    if (interaction.isButton() && (state.verb === 'progress' || state.verb === 'progback' || state.verb === 'progresult')) {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const page = state.verb === 'progress' ? 5 : state.verb === 'progresult' ? 0 : (basket.submitted ? 2 : 0);
        await renderPanel(interaction, { ...state, page, bpage: 0, focus: null, ...(page === 5 ? {} : { fromResult: false, dirty: false }) }, basket);
        return true;
    }

    if (interaction.isButton() && state.verb === 'dropok') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const selected = new Set(DRAW_KEY_ORDER.filter((_, i) => (state.mask & (1 << i)) !== 0));
        const updated = await writeTo(actingUserId, state, basket, { banners: applySelection(basket.banners, selected) });
        await renderPanel(interaction, { ...state, mask: 0 }, updated);
        return true;
    }

    // "+ Add more draws" on the form and on Edit Draws: every ticked draw adds ONE line, right after that draw's existing lines (setTypeCount), so copies of a draw stay together. A key drawprices no longer knows is skipped, and the calculation stops at MAX_LINES.
    if (interaction.isStringSelectMenu() && state.verb === 'addmore') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        let banners = basket.banners;
        let skipped = 0;
        for (const key of interaction.values) {
            if (!CALC_KEYS.includes(key)) continue;
            if (banners.length >= MAX_LINES) { skipped++; continue; }
            banners = setTypeCount(banners, key, banners.filter(b => b.drawKey === key).length + 1).banners;
        }
        const updated = await writeTo(actingUserId, state, basket, { banners });
        await renderPanel(interaction, state, updated, skipped ? `A calculation holds up to ${MAX_LINES} lines, so ${skipped === 1 ? '1 draw was' : `${skipped} draws were`} not added.` : null);
        return true;
    }

    if (interaction.isStringSelectMenu() && state.verb === 'bpulls') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const index = state.focus;
        if (index === null || !basket.banners[index]) { await renderPanel(interaction, state, basket); return true; }
        // Move Up is gone (2026-10-14 13:13 EDT), but a panel posted before still carries the option. It must do nothing: falling through would read 'up' as a spin count, Number('up') is NaN, and the line would silently drop to 0 spins.
        if (interaction.values[0] === 'up') { await renderPanel(interaction, { ...state, focus: null }, basket); return true; }
        // Remove opens the list, so a slipped tap must not cost entered progress: a line with pulls asks first; an empty line goes at once.
        if (interaction.values[0] === 'del' && basket.banners[index].pullsDone > 0) {
            const b = basket.banners[index];
            await renderPanel(interaction, { ...state, focus: index }, basket, `⚠️ Remove #${index + 1} ${lineName(b)} and its ${b.pullsDone} ${unitOf(b.drawKey).toLowerCase()} of progress?`, { mask: 0, count: 1, verb: 'dellineok', label: `Remove #${index + 1}` });
            return true;
        }
        if (interaction.values[0] === 'del') {
            const updated = await writeTo(actingUserId, state, basket, { banners: basket.banners.filter((_, i) => i !== index) });
            await renderPanel(interaction, { ...state, focus: null }, updated);
            return true;
        }
        // Upgrades unlock only once a draw is finished, so taking a line below its last spin drops what it had upgraded (2026-10-17 13:17 EDT).
        const banners = basket.banners.map((b, i) => {
            if (i !== index) return b;
            // An armory line's value is "size:items" when the line also picks its size (2026-10-18 12:16 EDT). Its Spins In stays only while there is a next item to spin toward.
            const [sizeRaw, itemsRaw] = String(interaction.values[0]).includes(':') ? String(interaction.values[0]).split(':') : [null, interaction.values[0]];
            const pullsDone = Number(itemsRaw) || 0;
            const next = sizeRaw !== null && isArmoryKey(b.drawKey) ? { ...b, size: Number(sizeRaw) || armorySize(b) } : { ...b };
            const total = pullCount(basket.region, next.drawKey, next);
            if (isArmoryKey(next.drawKey)) {
                if (total !== null && pullsDone >= total) delete next.spinsIn;
                // An armory's weapons hold an upgrade once one is collected, so only dropping back to none clears it.
                if (pullsDone === 0 && next.upHave) delete next.upHave;
                return { ...next, pullsDone };
            }
            if (total !== null && pullsDone < total && next.upHave) { const { upHave, ...rest } = next; return { ...rest, pullsDone }; }
            return { ...next, pullsDone };
        });
        const updated = await writeTo(actingUserId, state, basket, { banners });
        await renderPanel(interaction, { ...state, focus: null }, updated);
        return true;
    }

    // `setfocus` and `down` are no longer rendered (2026-10-13 14:28 EDT: each line carries its own ▲ now). Kept so a panel posted before that still answers its old controls.
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
        const updated = await writeTo(actingUserId, state, basket, { entitlementMask: mask });
        await renderPanel(interaction, state, updated);
        return true;
    }

    // THE SAVED VIEW (2026-10-14 13:13 EDT): a view of this message (page 3), reached from the nav row and left with Back. Opening one goes through `load` below. The Saved view carries the open calculation at the top (2026-10-14 16:51 EDT), so it loads it; a calculation that is gone just leaves that section out.
    if (interaction.isButton() && (state.verb === 'saved' || state.verb === 'delallarm')) {
        await renderPanel(interaction, { ...state, page: 3, mask: 0, check: null }, await currentBasket(actingUserId, state));
        return true;
    }
    if (interaction.isButton() && state.verb === 'back') {
        // loadOwned reopens the latest calculation when this message had none open, and says so when the one it had is gone.
        const basket = await loadOwned(interaction, { ...state, page: 0 }, actingUserId);
        if (!basket) return true;
        await renderPanel(interaction, { ...state, page: 0, focus: null, bpage: 0 }, basket);
        return true;
    }
    // SAVING lives in the Saved view now (2026-10-16): Save Result opens it; picking a saved calculation to replace only asks; the confirm replaces it.
    if (interaction.isButton() && state.verb === 'savepick') {
        await renderPanel(interaction, { ...state, page: 3, target: null }, await currentBasket(actingUserId, state));
        return true;
    }
    if (interaction.isStringSelectMenu() && state.verb === 'owsel') {
        const target = await basketStore.load(actingUserId, interaction.values[0]);
        const current = await currentBasket(actingUserId, state);
        if (!target || !target.name) { await renderPanel(interaction, { ...state, page: 3 }, current, 'That saved calculation is gone.'); return true; }
        await renderPanel(interaction, { ...state, page: 3 }, current, `⚠️ Replace **${target.name}**? Its draws, spins, region, balance and upgrade setting are overwritten with this calculation's.`, null, null, { target: String(target._id), name: target.name });
        return true;
    }
    if (interaction.isButton() && state.verb === 'owok') {
        const working = await currentBasket(actingUserId, state);
        const target = state.target ? await basketStore.load(actingUserId, state.target) : null;
        if (!working || !target || !target.name) { await renderPanel(interaction, { ...state, page: 3, target: null }, working, 'Nothing was saved: the calculation or the saved one is gone.'); return true; }
        const saved = await basketStore.save(actingUserId, { _id: String(target._id), banners: working.banners, region: working.region, balance: working.balance, includeUpgrades: working.includeUpgrades, mythicCards: working.mythicCards || 0, mythicCoins: working.mythicCoins || 0, currency: working.currency || null, entitlementMask: working.entitlementMask, submitted: working.submitted });
        // The working copy has done its job; a saved one picked as the open calculation is never removed here.
        if (!working.name && String(working._id) !== String(target._id)) await basketStore.remove(actingUserId, String(working._id));
        await renderPanel(interaction, { ...state, basketId: String(target._id), page: 0, target: null, verb: 'load' }, saved, `Replaced "${target.name}".`);
        return true;
    }

    // Picking calculations to delete only asks: the pick rides on the confirm button as positions in the list (`m`) plus a checksum of that list (`k`), since 25 ids do not fit a custom_id.
    if (interaction.isStringSelectMenu() && state.verb === 'savedsel') {
        const list = (await basketStore.listForUser(actingUserId)).slice(0, MAX_SAVED);
        const picked = new Set(interaction.values);
        const mask = list.reduce((m, b, i) => (picked.has(String(b._id)) ? m | (1 << i) : m), 0);
        const count = list.filter(b => picked.has(String(b._id))).length;
        if (!count) { await renderPanel(interaction, { ...state, page: 3 }, await currentBasket(actingUserId, state), 'Those calculations are already gone.'); return true; }
        await renderPanel(interaction, { ...state, page: 3 }, await currentBasket(actingUserId, state), `⚠️ Delete ${count === 1 ? 'this calculation' : `these ${count} calculations`}? This cannot be undone.`, null, { mask, count, check: savedChecksum(list) });
        return true;
    }
    if (interaction.isButton() && state.verb === 'savedelok') {
        const list = (await basketStore.listForUser(actingUserId)).slice(0, MAX_SAVED);
        // The list changed since the pick (a rename re-sorts it, another panel deleted one): positions no longer mean what was picked, so delete nothing and ask again.
        if (savedChecksum(list) !== state.check) { await renderPanel(interaction, { ...state, page: 3, mask: 0, check: null }, await currentBasket(actingUserId, state), 'Your saved list changed since you picked. Nothing was deleted; pick again.'); return true; }
        const ids = list.filter((_, i) => (state.mask & (1 << i)) !== 0).map(b => String(b._id));
        const deleted = await basketStore.removeMany(actingUserId, ids);
        const basketId = ids.includes(String(state.basketId)) ? null : state.basketId;
        await renderPanel(interaction, { ...state, basketId, page: 3, mask: 0, check: null }, await currentBasket(actingUserId, { basketId }), `Deleted ${deleted} calculation${deleted === 1 ? '' : 's'}.`);
        return true;
    }
    if (interaction.isButton() && state.verb === 'delall') {
        const list = await basketStore.listForUser(actingUserId);
        const deleted = await basketStore.removeAllNamed(actingUserId);
        const basketId = list.some(b => String(b._id) === String(state.basketId)) ? null : state.basketId;
        await renderPanel(interaction, { ...state, basketId, page: 3, verb: 'saved' }, await currentBasket(actingUserId, { basketId }), deleted === 1 ? 'Deleted your 1 saved calculation.' : `Deleted all ${deleted} saved calculations.`);
        return true;
    }

    // Opening a saved calculation lands on its RESULT (2026-10-14 16:51 EDT, Harkirat: "selecting a saved calc to view should open it to the result page, not take you through the full wizard process"). One that was saved before ever being calculated is calculated now; only an empty one opens on the form.
    if (interaction.isStringSelectMenu() && state.verb === 'load') {
        let opened = await basketStore.load(actingUserId, interaction.values[0]);
        if (opened && opened.banners.length && !opened.submitted) opened = await basketStore.save(actingUserId, { _id: String(opened._id), submitted: true });
        await renderPanel(interaction, { ...state, basketId: interaction.values[0], page: 0, focus: null, bpage: 0, detail: false, verb: 'load' }, opened);
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
        const updated = await writeTo(actingUserId, state, basket, { banners });
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
        const updated = await writeTo(actingUserId, state, basket, { region });
        await renderPanel(interaction, { ...state, targetRegion: null }, updated);
        return true;
    }

    if (interaction.isButton() && state.verb === 'upg') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const updated = await writeTo(actingUserId, state, basket, { includeUpgrades: !basket.includeUpgrades });
        await renderPanel(interaction, state, updated);
        return true;
    }

    // Calculate: the one transition from draft to result. Deliberately NOT two-step -- it is not destructive, and New Calculation is right there to go back. Refuses an empty calculation rather than submitting one that would immediately bounce back to the form (the button is also rendered disabled in that state).
    if (interaction.isButton() && state.verb === 'submit') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        if (!basket.banners.length) { await renderPanel(interaction, state, basket); return true; }
        const updated = await writeTo(actingUserId, state, basket, { submitted: true });
        await renderPanel(interaction, { ...state, page: 0, bpage: 0, focus: null, fromResult: false, dirty: false }, updated);
        return true;
    }

    if (interaction.isButton() && state.verb === 'dellineok') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        const index = state.focus;
        const banners = index !== null && basket.banners[index] ? basket.banners.filter((_, i) => i !== index) : basket.banners;
        const updated = await writeTo(actingUserId, state, basket, { banners });
        await renderPanel(interaction, { ...state, focus: null, mask: 0 }, updated);
        return true;
    }

    // Edit, beside Your Selection on the result (2026-10-13 23:01 EDT): the form, with everything kept, as a view of this calculation.
    if (interaction.isButton() && state.verb === 'edit') {
        const basket = await loadOwned(interaction, state, actingUserId);
        if (!basket) return true;
        // A view, not a state change: the calculation stays submitted, so leaving mid-edit still reopens on the result. Edit Selection opens Adjust Draws & Progress directly (2026-10-18 13:37 EDT, his ask): it covers everything about the draws. Back to Selections still reaches the form (page 2).
        await renderPanel(interaction, { ...state, page: 5, bpage: 0, focus: null, detail: false, fromResult: true, dirty: false }, basket);
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
        const gone = await basketStore.load(actingUserId, state.basketId);
        await basketStore.remove(actingUserId, state.basketId);
        // Delete lives in the Saved view now (2026-10-14 16:51 EDT): stay there and say what went. A panel posted before still sends it from the result, which keeps its old landing.
        if (state.page === 3) { await renderPanel(interaction, { ...state, basketId: null, page: 3, verb: 'saved' }, null, gone?.name ? `Deleted "${gone.name}".` : 'Deleted.'); return true; }
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
        // A SAVED calculation is never emptied by New Calculation (2026-10-14 16:51 EDT, Harkirat: "i clicked new calc, so why is it still saying viewing saved: test?"). Clearing it in place kept its name, so the fresh form claimed to be the saved one and the saved one lost its draws. A new, unnamed calculation starts instead, at the same region; the saved one stays in Saved untouched. A working copy of a saved one starts fresh too, and the copy is dropped (click-test 2026-10-14 18:58 EDT): cleared in place it kept its `sourceId`, so the empty form still read "Edited from Saved: test".
        if (basket.name || basket.sourceId) {
            if (!basket.name) await basketStore.remove(actingUserId, String(basket._id));
            const fresh = await basketStore.save(actingUserId, { banners: [], region: basket.region });
            await renderPanel(interaction, { ...state, basketId: String(fresh._id), page: 0, focus: null, bpage: 0, detail: false, verb: 'landing' }, fresh);
            return true;
        }
        // `submitted: false` is what makes this "New Calculation" rather than "empty result" -- it returns the panel to the setup form, which is what the button now says it does.
        const updated = await writeTo(actingUserId, state, basket, { banners: [], balance: 0, mythicCards: 0, mythicCoins: 0, currency: null, submitted: false });
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
