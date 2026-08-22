// ==========================================
// /manage — SEASON (pseudo-page) + SEASON DRAFT PAGE
// ==========================================
// Covers both of the panel's season-transition surfaces: the Season dropdown's two flat entries (Titles & Deadlines, Start New Season / "Wipe Season") which open their modal directly with no page of their own, and the "Next Season Draft" staging page (seasondraft) -- Promote/Discard plus its three bulk-stage modals. Grouped into one file since both are season-lifecycle operations on the same SeasonalData document, thematically closer to each other than to any other page. Split out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/ 2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S -- see draws.js's matching header note and .claude/rules/interaction-router.md.
//
// ⚠️ MUTATIONS ROUTE THROUGH THE OPERATION CORE (core/changeset.js's commitSet), as of plan 2 Task 5 (2026-08-21 13:10 EDT) -- the highest blast-radius entity in the system. `season.promoteDraft`/`season.startNew` are tier 3 rotations whose inverse is a FULL pre-rotation snapshot (`season.restoreSnapshot`), never a diff. `utils/manageActions.js`'s `draftGuard('promote'/'discard')` still refuses BEFORE the confirm buttons even render when no draft is active -- the `reason: 'missing'` branches below are a defensive re-check for the (rare) case a draft got discarded in the few seconds between that prompt and the click, same as patchnotes.js's editSeason. Undo now lives on /bot analytics' Changes page (core/revert.js) -- the old in-memory Undo button is GONE from every mutation here (see handlers/manage/shared.js's own header for where it used to live).

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
        content: `⚠️ **Are you sure?** This will rename the current season to **${newTitle}** and permanently wipe all Draws and Calendar data (Patch Notes history is kept). This cannot be undone.`,
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
                await prompt(interaction, { text: '❌ This confirmation has expired -- please start over from the Season dropdown.' });
            } catch (notifyError) {
                console.error('Failed to notify user of expired season-wipe confirmation:', notifyError);
            }
            return;
        }

        const result = await commitSet([{ type: 'season.startNew', payload: { newTitle: pending.newTitle } }], { actorId: interaction.user.id });
        if (!result.ok) {
            const why = extractCommitError(result);
            try { await prompt(interaction, { text: `❌ ${why}` }); }
            catch (notifyError) { console.error('Failed to notify user of season-wipe failure:', notifyError); }
            return;
        }
        const { prior } = result.results[0].applied;

        try {
            await prompt(interaction, {
                text: `✅ **Success:** Renamed the season to **${pending.newTitle}** and wiped Draws (${prior.newDraws.length + prior.returningDraws.length} entries) + Calendar (${prior.calendar.length} events). Patch Notes history was kept.`
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

// --- SEASON TITLES + DEADLINES (merged) --- custom_id: modal_season_titles_deadlines Each of the 3 deadline fields carries both a title and an end date on one line ("Battle Pass, August 28"); parsing (splitTitleDate/TBD handling) now lives entirely in core/ops/season.js.
async function setTitlesDeadlines(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const mainTitle = interaction.fields.getTextInputValue('main_title').trim();
    const bpLine = interaction.fields.getTextInputValue('bp_line');
    const rankLine = interaction.fields.getTextInputValue('rank_line');
    const dmzLine = interaction.fields.getTextInputValue('dmz_line');

    const result = await commitSet(
        [{ type: 'season.setTitlesDeadlines', payload: { mainTitle, bpLine, rankLine, dmzLine } }],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        const why = extractCommitError(result);
        return await interaction.followUp({ content: `❌ ${why}` });
    }
    const { change } = result.results[0];
    let confirmation = '✅ **Season Titles & Deadlines Updated!** The `/season end` module has been synced.';
    if (change.detail) confirmation += `\n⚠️ ${change.detail}.`;
    return interaction.followUp({ content: confirmation });
}

// --- NEXT SEASON DRAFT: PROMOTE / DISCARD --- custom_id: mng_draftpromoteconfirm / mng_draftpromotecancel / mng_draftdiscardconfirm / mng_draftdiscardcancel
async function handleDraftButton(interaction) {
    const customId = interaction.customId;

    if (customId === 'mng_draftpromoteconfirm') {
        const result = await commitSet([{ type: 'season.promoteDraft' }], { actorId: interaction.user.id });
        if (!result.ok) {
            const text = result.failedAt?.reason === 'missing'
                ? '❌ No draft in progress -- nothing to promote.'
                : `❌ ${extractCommitError(result)}`;
            try { await prompt(interaction, { text }); }
            catch (notifyError) { console.error('Failed to notify empty-draft promote attempt:', notifyError); }
            return;
        }
        const { change, applied } = result.results[0];
        try {
            await prompt(interaction, {
                text: `✅ **Draft promoted to live!** "${change.target}" is now the live season (${applied.counts.newDraws} New, ${applied.counts.returningDraws} Returning, ${applied.counts.calendar} calendar event(s)). The draft has been cleared.`
            });
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
        const result = await commitSet([{ type: 'season.discardDraft' }], { actorId: interaction.user.id });
        if (!result.ok) {
            try { await prompt(interaction, { text: `❌ ${extractCommitError(result)}` }); }
            catch (notifyError) { console.error('Failed to notify draft discard failure:', notifyError); }
            return;
        }
        try { await prompt(interaction, { text: "✅ Draft discarded. What's live is untouched." }); }
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
    const mainTitle = interaction.fields.getTextInputValue('main_title').trim();
    const bpLine = interaction.fields.getTextInputValue('bp_line');
    const rankLine = interaction.fields.getTextInputValue('rank_line');
    const dmzLine = interaction.fields.getTextInputValue('dmz_line');

    const result = await commitSet(
        [{ type: 'season.setDraftTitlesDeadlines', payload: { mainTitle, bpLine, rankLine, dmzLine } }],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        const why = extractCommitError(result);
        return await interaction.followUp({ content: `❌ ${why}` });
    }
    const { change } = result.results[0];
    let draftConfirmation = '✅ **Draft Titles & Deadlines Staged!** Nothing is live yet — use Promote to Live when ready.';
    if (change.detail) draftConfirmation += `\n⚠️ ${change.detail}.`;
    return interaction.followUp({ content: draftConfirmation });
}

// custom_id: modal_draft_bulk_draws
async function bulkDraftDraws(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const newText = interaction.fields.getTextInputValue('new_text')?.trim();
    const returningText = interaction.fields.getTextInputValue('returning_text')?.trim();

    const result = await commitSet(
        [{ type: 'season.bulkDraftDraws', payload: { newText, returningText } }],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        const why = extractCommitError(result);
        return await interaction.followUp({ content: `❌ ${why}` });
    }
    const { summary } = result.results[0].applied;
    return interaction.followUp({ content: `✅ **Draft Draws Staged!**\n${summary.join('\n')}\nNothing is live yet — use Promote to Live when ready.` });
}

// custom_id: modal_draft_bulk_calendar
async function bulkDraftCalendar(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const bulkText = interaction.fields.getTextInputValue('bulk_text');

    const result = await commitSet(
        [{ type: 'season.bulkDraftCalendar', payload: { text: bulkText } }],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        const why = extractCommitError(result);
        return await interaction.followUp({ content: `❌ ${why}` });
    }
    const { count } = result.results[0].applied;
    return interaction.followUp({ content: `✅ **Draft Calendar Staged!** ${count} event(s). Nothing is live yet — use Promote to Live when ready.` });
}

module.exports = { promptWipeSeason, handleWipeButton, setTitlesDeadlines, handleDraftButton, setDraftTitlesDeadlines, bulkDraftDraws, bulkDraftCalendar };
