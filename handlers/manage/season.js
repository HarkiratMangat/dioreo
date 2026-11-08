// ==========================================
// /manage — SEASON (pseudo-page) + SEASON DRAFT PAGE
// ==========================================
// Covers both of the panel's season-transition surfaces: the Season dropdown's two flat entries (Titles & Deadlines, Start New Season / "Wipe Season") which open their modal directly with no page of their own, and the "Next Season Draft" staging page (seasondraft) -- Promote/Discard plus its three bulk-stage modals. Grouped into one file since both are season-lifecycle operations on the same SeasonalData document, thematically closer to each other than to any other page. Split out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S -- see draws.js's matching header note and .claude/rules/interaction-router.md.
//
// ⚠️ MUTATIONS ROUTE THROUGH THE OPERATION CORE (core/changeset.js's commitSet), as of plan 2 Task 5 (2026-08-21 13:10 EDT) -- the highest blast-radius entity in the system. `season.promoteDraft`/`season.startNew` are tier 3 rotations whose inverse is a FULL pre-rotation snapshot (`season.restoreSnapshot`), never a diff. `utils/manageActions.js`'s `draftGuard('promote'/'discard')` still refuses BEFORE the confirm buttons even render when no draft is active -- the `reason: 'missing'` branches below are a defensive re-check for the (rare) case a draft got discarded in the few seconds between that prompt and the click, same as patchnotes.js's editSeason. Undo now lives on /bot analytics' Changes page (core/revert.js) -- the old in-memory Undo button is GONE from every mutation here (see handlers/manage/shared.js's own header for where it used to live).

const BOT_EMOJI = require('../../utils/emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const { commitSet } = require('../../core/changeset');
const { prompt, pendingSeasonWipes, extractCommitError } = require('./shared');

// --- START NEW SEASON, STEP 1 --- custom_id: modal_wipe_season Stashes the entered title in pendingSeasonWipes and shows a Confirm/Cancel step -- the actual wipe only happens from handleWipeButton below. Read-only, unchanged by the operation-core migration.
async function promptWipeSeason(interaction) {
    const { randomUUID } = require('crypto');
    const newTitle = interaction.fields.getTextInputValue('season_title').trim();
    const token = randomUUID().slice(0, 8);
    pendingSeasonWipes.set(token, { newTitle });
    setTimeout(() => pendingSeasonWipes.delete(token), 10 * 60 * 1000).unref();

    return interaction.reply({
        content: `${BOT_EMOJI.warn} **Are you sure?** This will rename the current season to **${newTitle}** and permanently wipe all Draws and Calendar data (Patch Notes history is kept). This cannot be undone.`,
        components: [{
            type: 1, components: [
                { type: 2, style: 4, label: 'Yes, Start New Season', custom_id: `mng_wipeconfirm_${token}` },
                { type: 2, style: 2, label: 'Cancel', custom_id: `mng_wipecancel_${token}` }
            ]
        }],
        ephemeral: true
    });
}

// --- START NEW SEASON, STEP 2 --- custom_id: mng_wipeconfirm_{token} / mng_wipecancel_{token}
async function handleWipeButton(interaction) {
    const customId = interaction.customId;

    if (customId.startsWith('mng_wipeconfirm_')) {
        const token = customId.replace('mng_wipeconfirm_', '');
        const pending = pendingSeasonWipes.get(token);
        pendingSeasonWipes.delete(token);
        if (!pending) {
            try {
                await prompt(interaction, { text: BOT_EMOJI.cross + ' This confirmation has expired -- please start over from the Season dropdown.' });
            } catch (notifyError) {
                console.error('Failed to notify user of expired season-wipe confirmation:', notifyError);
            }
            return;
        }

        const result = await commitSet([{ type: 'season.startNew', payload: { newTitle: pending.newTitle } }], { actorId: interaction.user.id });
        if (!result.ok) {
            const why = extractCommitError(result);
            try { await prompt(interaction, { text: `${BOT_EMOJI.cross} ${why}` }); }
            catch (notifyError) { console.error('Failed to notify user of season-wipe failure:', notifyError); }
            return;
        }
        const { prior } = result.results[0].applied;

        try {
            await prompt(interaction, {
                text: `${BOT_EMOJI.checkmark} **Success:** Renamed the season to **${pending.newTitle}** and wiped Draws (${prior.newDraws.length + prior.returningDraws.length} entries) + Calendar (${prior.calendar.length} events). Patch Notes history was kept.`
            });
        } catch (notifyError) {
            console.error('Failed to confirm season wipe (interaction likely expired):', notifyError);
        }
        return;
    }

    if (customId.startsWith('mng_wipecancel_')) {
        const token = customId.replace('mng_wipecancel_', '');
        pendingSeasonWipes.delete(token);
        try {
            await prompt(interaction, { text: '❎ Cancelled -- nothing was changed.' });
        } catch (notifyError) {
            console.error('Failed to confirm season-wipe cancellation (interaction likely expired):', notifyError);
        }
        return;
    }
}

// --- SEASON TITLES + DEADLINES (merged) --- custom_id: modal_season_titles_deadlines Each of the 3 deadline fields carries both a title and an end date on one line ("Battle Pass, August 28"); parsing (splitTitleDate/TBD handling) now lives entirely in core/ops/season.js. 2026-11-07 21:06 EST The save is lifted out of the pop-up handlers so the Season panel (handlers/manage/seasonPanel/) can run the SAME write and draw its own answer. Each returns { ok, message } with NO leading emoji; the old handlers below put the cross or checkmark back, so what they send is byte-for-byte what it was.
const readTitleFields = (interaction) => ({
    mainTitle: interaction.fields.getTextInputValue('main_title').trim(),
    bpLine: interaction.fields.getTextInputValue('bp_line'),
    rankLine: interaction.fields.getTextInputValue('rank_line'),
    dmzLine: interaction.fields.getTextInputValue('dmz_line')
});

async function saveTitlesDeadlines(actorId, fields, { draft = false } = {}) {
    const result = await commitSet([{ type: draft ? 'season.setDraftTitlesDeadlines' : 'season.setTitlesDeadlines', payload: fields }], { actorId });
    if (!result.ok) return { ok: false, message: extractCommitError(result) };
    const { change } = result.results[0];
    let message = draft
        ? '**Draft Titles & Deadlines Staged!** Nothing is live yet — use Promote to Live when ready.'
        : '**Season Titles & Deadlines Updated!** The `/season end` module has been synced.';
    if (change.detail) message += `\n${BOT_EMOJI.warn} ${change.detail}.`;
    return { ok: true, message, changeIds: result.changeIds };
}

async function setTitlesDeadlines(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const r = await saveTitlesDeadlines(interaction.user.id, readTitleFields(interaction));
    return interaction.followUp({ content: `${r.ok ? BOT_EMOJI.checkmark : BOT_EMOJI.cross} ${r.message}` });
}

// 2026-11-07 21:06 EST Promote and Discard lifted out of the confirm buttons for the Season panel's in-place confirm. `missing` is the defensive "the draft vanished between the prompt and the click" branch.
async function runPromoteDraft(actorId) {
    const result = await commitSet([{ type: 'season.promoteDraft' }], { actorId });
    if (!result.ok) return { ok: false, missing: result.failedAt?.reason === 'missing', message: result.failedAt?.reason === 'missing' ? 'No draft in progress -- nothing to promote.' : extractCommitError(result) };
    const { change, applied } = result.results[0];
    return { ok: true, changeIds: result.changeIds, message: `**Draft promoted to live!** "${change.target}" is now the live season (${applied.counts.newDraws} New, ${applied.counts.returningDraws} Returning, ${applied.counts.calendar} calendar event(s)). The draft has been cleared.` };
}
async function runDiscardDraft(actorId) {
    const result = await commitSet([{ type: 'season.discardDraft' }], { actorId });
    if (!result.ok) return { ok: false, message: extractCommitError(result) };
    return { ok: true, changeIds: result.changeIds, message: "**Draft discarded.** What's live is untouched." };
}

// --- NEXT SEASON DRAFT: PROMOTE / DISCARD --- custom_id: mng_draftpromoteconfirm / mng_draftpromotecancel / mng_draftdiscardconfirm / mng_draftdiscardcancel
async function handleDraftButton(interaction) {
    const customId = interaction.customId;

    if (customId === 'mng_draftpromoteconfirm') {
        const r = await runPromoteDraft(interaction.user.id);
        if (!r.ok) {
            try { await prompt(interaction, { text: `${BOT_EMOJI.cross} ${r.message}` }); }
            catch (notifyError) { console.error('Failed to notify empty-draft promote attempt:', notifyError); }
            return;
        }
        try {
            await prompt(interaction, { text: `${BOT_EMOJI.checkmark} ${r.message}` });
        } catch (notifyError) {
            console.error('Failed to confirm draft promote (interaction likely expired):', notifyError);
        }
        return;
    }

    if (customId === 'mng_draftpromotecancel') {
        try { await prompt(interaction, { text: '❎ Promote cancelled -- the draft is untouched.' }); }
        catch (notifyError) { console.error('Failed to confirm draft promote cancellation (interaction likely expired):', notifyError); }
        return;
    }

    if (customId === 'mng_draftdiscardconfirm') {
        const r = await runDiscardDraft(interaction.user.id);
        if (!r.ok) {
            try { await prompt(interaction, { text: `${BOT_EMOJI.cross} ${r.message}` }); }
            catch (notifyError) { console.error('Failed to notify draft discard failure:', notifyError); }
            return;
        }
        try { await prompt(interaction, { text: `${BOT_EMOJI.checkmark} ${r.message}` }); }
        catch (notifyError) { console.error('Failed to confirm draft discard (interaction likely expired):', notifyError); }
        return;
    }

    if (customId === 'mng_draftdiscardcancel') {
        try { await prompt(interaction, { text: '❎ Discard cancelled -- the draft is untouched.' }); }
        catch (notifyError) { console.error('Failed to confirm draft discard cancellation (interaction likely expired):', notifyError); }
        return;
    }
}

// --- NEXT SEASON DRAFT: submit handlers --- custom_id: modal_draft_titles_dates Same shape as setTitlesDeadlines above -- parsing (splitTitleDate/TBD handling) lives entirely in core/ops/season.js, this just writes into seasonalDoc.draft.* instead of the top-level fields, so none of it touches what's currently live.
async function setDraftTitlesDeadlines(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const r = await saveTitlesDeadlines(interaction.user.id, readTitleFields(interaction), { draft: true });
    return interaction.followUp({ content: `${r.ok ? BOT_EMOJI.checkmark : BOT_EMOJI.cross} ${r.message}` });
}

// custom_id: modal_draft_bulk_draws
async function saveDraftDraws(actorId, newText, returningText) {
    const result = await commitSet([{ type: 'season.bulkDraftDraws', payload: { newText, returningText } }], { actorId });
    if (!result.ok) return { ok: false, message: extractCommitError(result) };
    const { summary } = result.results[0].applied;
    // A staged draw's images and items reach the draw index now, at staging (core/ops/season.js), so its item kinds are asked about now too (handlers/manage/itemKinds.js): `titles` is for the caller's askItemKinds.
    const { parseBulkDrawList } = require('../../utils/adminParser');
    const titles = [newText, returningText].filter(Boolean).flatMap(t => parseBulkDrawList(t).map(d => d.title));
    return { ok: true, titles, changeIds: result.changeIds, message: `**Draft Draws Staged!**\n${summary.join('\n')}\nNothing is live yet — use Promote to Live when ready.` };
}

async function bulkDraftDraws(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const newText = interaction.fields.getTextInputValue('new_text')?.trim();
    const returningText = interaction.fields.getTextInputValue('returning_text')?.trim();
    const r = await saveDraftDraws(interaction.user.id, newText, returningText);
    if (!r.ok) return await interaction.followUp({ content: `${BOT_EMOJI.cross} ${r.message}` });
    const sent = await interaction.followUp({ content: `${BOT_EMOJI.checkmark} ${r.message}` });
    await require('./itemKinds').askItemKinds(interaction, r.titles);
    return sent;
}

// custom_id: modal_draft_bulk_calendar
async function saveDraftCalendar(actorId, text) {
    const result = await commitSet([{ type: 'season.bulkDraftCalendar', payload: { text } }], { actorId });
    if (!result.ok) return { ok: false, message: extractCommitError(result) };
    const { count } = result.results[0].applied;
    return { ok: true, changeIds: result.changeIds, message: `**Draft Calendar Staged!** ${count} event(s). Nothing is live yet — use Promote to Live when ready.` };
}

async function bulkDraftCalendar(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const r = await saveDraftCalendar(interaction.user.id, interaction.fields.getTextInputValue('bulk_text'));
    return interaction.followUp({ content: `${r.ok ? BOT_EMOJI.checkmark : BOT_EMOJI.cross} ${r.message}` });
}

module.exports = { promptWipeSeason, handleWipeButton, setTitlesDeadlines, handleDraftButton, setDraftTitlesDeadlines, bulkDraftDraws, bulkDraftCalendar, readTitleFields, saveTitlesDeadlines, saveDraftDraws, saveDraftCalendar, runPromoteDraft, runDiscardDraft };
