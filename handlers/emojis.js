// ==========================================
// EMOJIS — INTERACTION HANDLER
// ==========================================
// /emojis' buttons (commands/emojis.js): `emo_filter_<all|missing>`, `emo_page_<n>_<filter>`, and `emo_sync_<filter>`, which uploads every missing emoji to every app of this process that lacks it (utils/emojiSync.js) and redraws the panel with what happened. Owner only on every click: an upload changes the app's own emoji list.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S (handlers/router.js); the error replies here are awaited in their own try/catch.
const emojis = require('../utils/emojiMap');
const { isOwnerId } = require('../utils/owner');

const OWNED_PREFIXES = ['emo_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function route(interaction) {
    if (!interaction.isButton()) return;
    if (!isOwnerId(interaction.user.id)) {
        try { await interaction.reply({ content: `${emojis.cross} Only Dioreo's developer can use this.`, ephemeral: true }); } catch (e) { console.error('Failed to refuse an /emojis button:', e); }
        return;
    }
    const { buildEmojiPanel, loadState } = require('../commands/emojis');
    const { sendV2Payload } = require('../utils/sendV2Payload');
    const isSync = interaction.customId.startsWith('emo_sync_') && interaction.customId !== 'emo_sync_none';
    if (!interaction.customId.startsWith('emo_filter_') && !interaction.customId.startsWith('emo_page_') && !isSync) return; // the page counter and the disabled "Nothing to sync"
    const [, , a, b] = interaction.customId.split('_');
    await interaction.deferUpdate();
    let filter = 'all', page = 0, note = null;
    if (interaction.customId.startsWith('emo_filter_')) filter = a === 'missing' ? 'missing' : 'all';
    if (interaction.customId.startsWith('emo_page_')) { page = Number(a) || 0; filter = b === 'missing' ? 'missing' : 'all'; }
    let state = await loadState();
    if (isSync) {
        filter = a === 'missing' ? 'missing' : 'all';
        const { uploadMissing } = require('../utils/emojiSync');
        const done = [], failed = [];
        for (const row of state.rows) {
            for (const [i, app] of state.apps.entries()) {
                if (row.has[i]) continue;
                const res = await uploadMissing(app.client, row);
                if (res.ok) done.push(`${row.name} → ${app.label}`);
                else { failed.push(`${row.name} → ${app.label}`); console.error(`/emojis sync: ${row.name} to ${app.label} failed: ${res.error}`); }
            }
        }
        // Each app's emoji map re-points by name, so the panels using a just-uploaded emoji draw it at once rather than after the next restart.
        for (const app of state.apps) {
            try { await emojis.refreshEmojiIds(app.client, { secondary: app.key === 'admin' }); } catch (e) { console.error('Emoji map refresh after /emojis sync failed:', e?.message || e); }
        }
        state = await loadState();
        note = `${done.length ? `${emojis.checkmark} Synced ${done.length}` : 'Synced 0'}${failed.length ? ` · ${emojis.cross} ${failed.length} failed: ${failed.slice(0, 5).join(', ')}${failed.length > 5 ? '…' : ''} (details in the log)` : ''}`;
    }
    await sendV2Payload(interaction, buildEmojiPanel({ ...state, page, filter, note, senderAppId: interaction.applicationId }));
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the uniform contract every handlers/*.js module follows.
async function handleEmojisInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleEmojisInteraction, OWNED_PREFIXES };
