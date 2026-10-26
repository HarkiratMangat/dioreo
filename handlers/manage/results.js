// ==========================================
// /manage — THE BUTTONS UNDER A SAVED DRAW, EVENT OR SEASON
// ==========================================
// custom_ids: mng_rsopen|draws|{new|returning} · mng_rsopen|calendar · mng_rsopen|patch|{id} · mng_rsedit|draws|{new|returning}|{id} · mng_rsedit|calendar|{id} · mng_rsedit|patch|{id} · mng_rsrevert|{changeId,...}, drawn by utils/managePanels.js (2026-10-26 13:01 EDT, Harkirat's "build them right now here"). Stateless, so they keep working after a restart. The router's /manage lock has already run on the `mng_` prefix; Edit again opens the same pop-up a search would and its submit goes through commitSet's own permission check, and Revert is gated per change by the check /bot analytics' Revert uses (utils/adminAccess.js checkRevert), which core/revert.js runs again.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S -- see draws.js's matching header note and .claude/rules/interaction-router.md.

const BOT_EMOJI = require('../../utils/emojiMap');

// Every change a save made, newest first, so a swap or a restore unwinds in order. `doneNote` is the page's own last line ("the build is back as it was").
async function revertChanges(interaction, changeIds, doneNote = 'it is back as it was') {
    const { getChange } = require('../../utils/changeStore');
    const { checkRevert } = require('../../utils/adminAccess');
    const { notePanel, FAIL_ACCENT } = require('../../utils/managePanels');
    for (const changeId of changeIds) {
        const row = await getChange(changeId);
        if (!row) return await interaction.reply({ content: `${BOT_EMOJI.cross} Change ${changeId} no longer exists, so nothing was reverted.`, ephemeral: true });
        const gate = await checkRevert(interaction.user.id, row);
        if (!gate.ok) return await interaction.reply({ content: gate.reason, ephemeral: true });
    }
    await interaction.deferUpdate();
    const { revertChange } = require('../../core/revert');
    const done = [];
    for (const changeId of [...changeIds].reverse()) {
        const res = await revertChange(changeId, { actorId: interaction.user.id });
        if (!res.ok) {
            return await interaction.followUp({ flags: 32768 | 64, components: notePanel(`${BOT_EMOJI.cross} **Revert stopped at ${changeId}:** ${res.reason}${done.length ? `\n-# Already reverted: ${done.join(', ')}` : ''}`, FAIL_ACCENT) });
        }
        done.push(changeId);
    }
    const { sendV2Payload } = require('../../utils/sendV2Payload');
    return await sendV2Payload(interaction, notePanel(`↩️ **Reverted.** ${done.join(', ')} undone; ${doneNote}.`));
}

// Open: the page players see, privately, through the command's own execute() (a synthetic interaction, utils/interactionContext.js), so it can never drift from the real command. A draw opens on its New or Returning section, a season on itself, the calendar on its Today page.
async function openPage(interaction, page, arg) {
    const { buildSyntheticInteraction } = require('../../utils/interactionContext');
    const synth = buildSyntheticInteraction(interaction, {
        isChatInputCommand: () => true,
        options: { getString: (name) => (name === 'visibility' ? 'hidden' : null), getBoolean: () => null, getInteger: () => null, getSubcommand: () => null },
    });
    // Looked up on client.commands, as handlers/pagination.js does, never required: a require here would put the whole /manage handler tree in those commands' hotpatch closure (scripts/hotpatch.test.js).
    const command = interaction.client.commands.get({ draws: 'draws', calendar: 'calendar', patch: 'patch' }[page]);
    if (!command) return false;
    if (page === 'draws') return await command.execute(synth, arg === 'returning' ? 'returning' : 'new', 0);
    if (page === 'calendar') return await command.execute(synth);
    return await command.execute(synth, arg || null);
    return false;
}

async function handleResultAction(interaction) {
    const id = interaction.customId;
    if (id.startsWith('mng_rsopen|')) { const [, page, arg] = id.split('|'); return await openPage(interaction, page, arg); }
    if (id.startsWith('mng_rsrevert|')) return await revertChanges(interaction, id.replace('mng_rsrevert|', '').split(',').filter(Boolean));

    // Edit again: showModal must be the first response, so nothing here defers; one read of the seasonal document is well inside the 3 seconds.
    const [, page, ...rest] = id.split('|');
    const manageCommand = interaction.client.commands.get('manage');
    const { loadSeasonalDoc } = require('../../utils/manageActions');
    const doc = await loadSeasonalDoc();
    const gone = (what) => interaction.reply({ content: `${BOT_EMOJI.cross} That ${what} no longer exists -- it may have been changed or removed since this was saved.`, ephemeral: true });
    if (page === 'draws') {
        const [category, drawId] = rest;
        const draw = (category === 'new' ? doc?.newDraws : doc?.returningDraws)?.find(d => String(d._id) === drawId);
        if (!draw) return await gone('draw');
        return await interaction.showModal(manageCommand.buildEditDrawModal(draw, drawId, category));
    }
    if (page === 'calendar') {
        const event = doc?.calendar?.find(e => String(e._id) === rest[0]);
        if (!event) return await gone('event');
        return await interaction.showModal(manageCommand.buildEditCalendarModal(event, rest[0]));
    }
    if (page === 'patch') {
        const entry = doc?.patchNotes?.find(p => String(p._id) === rest[0]);
        if (!entry) return await gone('season');
        const UserPreference = require('../../models/UserPreference');
        const prefs = await UserPreference.findOne({ discordId: interaction.user.id }).lean();
        return await interaction.showModal(manageCommand.buildPatchEditSeasonModal(entry, prefs?.timezone));
    }
    return false;
}

module.exports = { handleResultAction, revertChanges };
