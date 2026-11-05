// handlers/news.js -- the news card's buttons and the skipped list's dropdown (news-channel-triage, built 2026-11-04 20:02 EST). `news|go|<card>|<item>` opens the /manage box the item needs, filled in; `news|dismiss|<card>` closes the card; `news|make` (a select) makes a card from a skipped post.
//
// Nothing here writes Dioreo's data: every write is /manage's own submit, behind the router's /manage lock, so a box opened from a card saves, validates and undoes exactly like one opened in /manage. Each click checks /manage access itself as well, because a card sits in a channel.
const { MessageFlags } = require('discord.js');
const OWNED_PREFIXES = ['news|'];

async function allowed(interaction) {
    const { hasCommandAccess } = require('../utils/adminAccess');
    if (await hasCommandAccess(interaction.user.id, 'manage')) return true;
    try { await interaction.reply({ content: '🔒 Only Dioreo\'s admins can use these cards.', flags: MessageFlags.Ephemeral }); } catch (e) { console.error('News card: could not refuse a click:', e); }
    return false;
}

async function mayOpen(interaction, item) {
    if (item.action === 'patch') return true; // the Add to Patch Notes command checks its own tier (canDo 'rightclick.addToPatchNotes')
    let ok = false; let message = null;
    if (item.where === 'draft') {
        const res = await require('../utils/manageActions').resolveAction('seasondraft', item.action === 'season' ? 'settitles' : item.action === 'draw' ? 'bulkdraws' : 'bulkcalendar', interaction.user.id);
        ok = res.ok; message = res.message || null;
    } else {
        const { canDo, denyDo } = require('../utils/adminAccess');
        const key = item.action === 'draw' ? 'rightclick.addToDraws' : 'rightclick.addToCalendar';
        ok = await canDo(interaction.user.id, key);
        if (!ok) message = denyDo(key);
    }
    if (ok) return true;
    try { await interaction.reply({ content: message || 'You do not have access to that box.', flags: MessageFlags.Ephemeral }); } catch (e) { console.error('News card: could not refuse a click:', e); }
    return false;
}

async function fetchSource(client, card) {
    try {
        const channel = await client.channels.fetch(card.sourceChannelId);
        return await channel.messages.fetch(card.sourceMessageId);
    } catch { return null; }
}

async function markOpened(interaction, card, index) {
    const NewsCard = require('../models/NewsCard');
    await NewsCard.updateOne({ _id: card._id }, { $set: { [`items.${index}.state`]: 'opened' } }).catch(() => {});
    const fresh = await NewsCard.findById(card._id).lean().catch(() => null);
    if (fresh) await require('../utils/newsTriage/pipeline').redrawCard(interaction.client.rest, fresh, interaction.applicationId);
}

async function openItem(interaction, cardId, index) {
    const NewsCard = require('../models/NewsCard');
    const card = await NewsCard.findById(cardId).lean().catch(() => null);
    const item = card?.items?.[index];
    if (!card || !item) {
        try { await interaction.reply({ content: 'That card is no longer stored (cards are kept 30 days).', flags: MessageFlags.Ephemeral }); } catch (e) { console.error(e); }
        return;
    }
    // The box's page tier, checked here as /manage checks it per click (security review, 2026-11-04 20:27 EST): /manage access alone let an admin without the Draws, Calendar or Next Season Draft create tier open that page's box. The submit is checked again by the op itself.
    if (!(await mayOpen(interaction, item))) return;
    const r = require('../utils/newsTriage/resolve');
    const manage = interaction.client.commands.get('manage');

    if (item.action === 'patch') {
        const source = await fetchSource(interaction.client, card);
        if (!source) {
            try { await interaction.reply({ content: 'The source post could not be read (deleted, or Dioreo Admin can no longer see that channel).', flags: MessageFlags.Ephemeral }); } catch (e) { console.error(e); }
            return;
        }
        const patch = interaction.client.commands.get('Add to Patch Notes');
        const { buildSyntheticInteraction } = require('../utils/interactionContext');
        await patch.execute(buildSyntheticInteraction(interaction, { targetMessage: source }));
        return markOpened(interaction, card, index);
    }

    // showModal must be the first answer, so the image is the stored read's, and re-read only when the post has none to offer (a Discord image link is signed and expires, which is why a draw's image is re-hosted to Cloudinary on save).
    const source = item.action === 'draw' && !item.catalogueTitle ? await fetchSource(interaction.client, card) : null;
    const image = source ? require('../utils/newsTriage/pipeline').toPost(source).image : '';
    let modal;
    if (item.action === 'draw' && item.where === 'live') modal = manage.buildAddDrawModal(item.drawType === 'returning' ? 'returning' : 'new', r.drawPrefill(item, image));
    else if (item.action === 'calendar' && item.where === 'live') modal = manage.buildCalendarAddModal(r.calendarPrefill(item));
    else if (item.where === 'draft') {
        const { loadSeasonalDoc } = require('../utils/manageActions');
        const doc = await loadSeasonalDoc();
        if (item.action === 'season') modal = manage.buildDraftTitlesDatesModal(doc, { mainTitle: item.name, bpStart: item.start });
        else {
            const line = item.action === 'draw' ? r.draftDrawLine(item, image) : r.draftCalendarLine(item);
            // The draft boxes hold 4,000 characters and the calendar one REPLACES the whole staged list, so a line that does not fit is handed over to paste instead of being left out of a box he would submit believing it was added (think-pass, 2026-11-04 22:09 EST).
            const { formatDrawsAsBulkText, formatCalendarAsBulkText } = require('../utils/adminParser');
            const draft = doc?.draft || {};
            const staged = item.action === 'draw' ? formatDrawsAsBulkText((item.drawType === 'returning' ? draft.returningDraws : draft.newDraws) || []) : formatCalendarAsBulkText(draft.calendar || []);
            if ((staged ? staged.length + 1 : 0) + line.length > 4000) {
                try { await interaction.reply({ content: `The Next Season Draft's box is too full to take this line. Paste it in yourself with /manage season draft:\n\`\`\`\n${line}\n\`\`\``, flags: MessageFlags.Ephemeral }); } catch (e) { console.error(e); }
                return;
            }
            modal = item.action === 'draw'
                ? manage.buildDraftBulkDrawsModal(doc, { [item.drawType === 'returning' ? 'returningLine' : 'newLine']: line })
                : manage.buildDraftBulkCalendarModal(doc, { line });
        }
    }
    if (!modal) {
        try { await interaction.reply({ content: 'This item has no box to open: change it in /manage.', flags: MessageFlags.Ephemeral }); } catch (e) { console.error(e); }
        return;
    }
    await interaction.showModal(modal);
    return markOpened(interaction, card, index);
}

async function dismiss(interaction, cardId) {
    const NewsCard = require('../models/NewsCard');
    await interaction.deferUpdate();
    await NewsCard.updateOne({ _id: cardId }, { $set: { dismissed: true } }).catch(() => {});
    const card = await NewsCard.findById(cardId).lean().catch(() => null);
    if (card) await require('../utils/newsTriage/pipeline').redrawCard(interaction.client.rest, card, interaction.applicationId);
}

// "Make a card from one of these…" on the skipped list: read the post again and card it whatever the filter said.
async function makeCard(interaction) {
    const [channelId, messageId] = String(interaction.values?.[0] || '').split(':');
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const pipeline = require('../utils/newsTriage/pipeline');
    let message;
    try { message = await (await interaction.client.channels.fetch(channelId)).messages.fetch(messageId); } catch { message = null; }
    if (!message) return interaction.editReply({ content: 'That post could not be read: it may have been deleted.' });
    const result = await pipeline.processPost(pipeline.toPost(message), { rest: interaction.client.rest, selfId: interaction.client.user?.id, appId: interaction.applicationId, force: true });
    const say = {
        carded: 'Card posted.',
        'already carded': 'That post already has a card.',
        'no card': `The AI found nothing to add (${result.reason || 'no items'}).`,
        error: `The AI read failed: ${result.error || 'unknown error'}.`,
        paused: 'AI reads are paused for an hour after errors.',
    }[result.status] || `Nothing posted (${result.status}).`;
    return interaction.editReply({ content: say });
}

async function handleNewsInteraction(interaction) {
    if (typeof interaction.customId !== 'string' || !interaction.customId.startsWith('news|')) return false;
    if (!(await allowed(interaction))) return true;
    const [, action, cardId, index] = interaction.customId.split('|');
    if (interaction.isButton() && action === 'go') { await openItem(interaction, cardId, Number(index)); return true; }
    if (interaction.isButton() && action === 'dismiss') { await dismiss(interaction, cardId); return true; }
    if (interaction.isStringSelectMenu() && action === 'make') { await makeCard(interaction); return true; }
    return false;
}

module.exports = { handleNewsInteraction, OWNED_PREFIXES };
