// handlers/news.js -- the news card's buttons and the skipped list's dropdown (news-channel-triage, built 2026-11-04 20:02 EST). `news|go|<card>|<item>` opens the /manage box the item needs, filled in; `news|dismiss|<card>` closes the card; `news|make` (a select) makes a card from a skipped post.
//
// Nothing here writes Dioreo's data: every write is /manage's own submit, behind the router's /manage lock, so a box opened from a card saves, validates and undoes exactly like one opened in /manage. Each click checks /manage access itself as well, because a card sits in a channel.
const { MessageFlags } = require('discord.js');
const OWNED_PREFIXES = ['news|'];

// ACKNOWLEDGE FIRST (2026-11-14 12:02 EST, news-triage-undo: an Undo press showed "The application didn't respond in time"). Discord gives a click 3 seconds to be acknowledged, and every card button used to read the database (the /manage check, the card) before its first answer, so one slow read or one stalled event loop lost the click with nothing logged. Now a button or dropdown that can be deferred is acknowledged BEFORE its first await on anything (handleNewsInteraction), and everything after it answers through speak(). Only `news|go` cannot: showModal must be the first answer, so its reads stay ahead of the box.
//   'reply'  deferReply, private: later answers are editReply (Undo draft changes, Make a card, Never drafted)
//   'update' deferUpdate on the card itself: a refusal is a private followUp (Dismiss)
//   null     not acknowledged yet: a plain private reply (the box buttons)
async function speak(interaction, ack, content) {
    try {
        if (ack === 'reply') await interaction.editReply({ content });
        else if (ack === 'update') await interaction.followUp({ content, flags: MessageFlags.Ephemeral });
        else await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    } catch (e) { console.error('News card: could not answer a click (interaction likely expired):', e); }
}

async function ackFirst(interaction, ack) {
    try {
        if (ack === 'update') await interaction.deferUpdate(); else await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        return true;
    } catch (e) { console.error('News card: could not acknowledge a click (interaction likely expired):', e); return false; }
}

// After an acknowledgement a throw would leave Discord on "thinking..." with nothing to say why (the router's net only logs), so a failure is logged AND answered.
async function guarded(interaction, ack, work) {
    try { await work(); } catch (err) {
        console.error('News card: a click failed after it was acknowledged:', err);
        await speak(interaction, ack, 'That did not finish, and the error is in the bot log. Press it again to see where it stands.');
    }
}

async function allowed(interaction, ack = null) {
    const { hasCommandAccess } = require('../utils/adminAccess');
    if (await hasCommandAccess(interaction.user.id, 'manage')) return true;
    await speak(interaction, ack, '🔒 Only Dioreo\'s admins can use these cards.');
    return false;
}

async function mayOpen(interaction, item) {
    if (item.action === 'patch') return true; // the Add to Patch Notes command checks its own tier (canDo 'rightclick.addToPatchNotes')
    let ok = false; let message = null;
    if (item.action === 'fix') {
        const res = await require('../utils/manageActions').resolveAction(item.fixList === 'calendar' ? 'calendar' : 'draws', 'edit', interaction.user.id);
        ok = res.ok; message = res.message || null;
    } else if (item.where === 'draft') {
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
    if (item.action === 'fix') {
        const { loadSeasonalDoc } = require('../utils/manageActions');
        const doc = await loadSeasonalDoc();
        const row = (doc?.[item.fixList] || []).find(r => String(r._id) === item.fixId);
        if (!row) {
            try { await interaction.reply({ content: 'That row is no longer on the bot (deleted or replaced since the card was posted).', flags: MessageFlags.Ephemeral }); } catch (e) { console.error(e); }
            return;
        }
        if (item.fixList === 'calendar') modal = manage.buildEditCalendarModal({ ...row, date: item.start || row.date, endDate: item.end || row.endDate, isOngoing: item.end ? false : row.isOngoing }, item.fixId);
        else {
            // The draw's end lives on its /calendar draw row; the Edit Draw box takes it as `row` and its save moves both (handlers/manage/draws.js editDraw).
            const calRow = require('../utils/drawEndReminder').calendarRowFor(doc, row.title);
            modal = manage.buildEditDrawModal({ ...row, date: item.start || row.date }, item.fixId, item.fixDrawType || 'new', { ...(calRow || {}), endDate: item.end || calRow?.endDate || null });
        }
        await interaction.showModal(modal);
        return markOpened(interaction, card, index);
    }
    if (item.action === 'draw' && item.where === 'live') modal = manage.buildAddDrawModal(item.drawType === 'returning' ? 'returning' : 'new', r.drawPrefill(item, image));
    else if (item.action === 'calendar' && item.where === 'live') modal = manage.buildCalendarAddModal(r.calendarPrefill(item));
    else if (item.where === 'draft') {
        const { loadSeasonalDoc } = require('../utils/manageActions');
        const doc = await loadSeasonalDoc();
        if (item.action === 'season') modal = manage.buildDraftTitlesDatesModal(doc, { mainTitle: item.name, bpStart: item.start });
        else {
            const line = item.action === 'draw' ? r.draftDrawLine(item, image) : r.draftCalendarLine(item);
            // The draft boxes open with only this line and their submit adds or updates it (2026-11-09, the /manage audit: they used to hold the whole staged list and replace it, so a full box had to hand the line over to paste instead).
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
    // Closing a card takes a tier that can act on one (the fresh review R1, 2026-11-05 20:14 EST: /manage access alone let a loadouts-only admin dismiss any card).
    const { canDo } = require('../utils/adminAccess');
    const may = (await canDo(interaction.user.id, 'rightclick.addToCalendar')) || (await require('../utils/manageActions').resolveAction('seasondraft', 'bulkcalendar', interaction.user.id)).ok;
    if (!may) return speak(interaction, 'update', 'You do not have access to act on these cards.');
    await NewsCard.updateOne({ _id: cardId }, { $set: { dismissed: true } }).catch(() => {});
    const card = await NewsCard.findById(cardId).lean().catch(() => null);
    if (card) await require('../utils/newsTriage/pipeline').redrawCard(interaction.client.rest, card, interaction.applicationId);
}

// Undo draft changes: reverts the ChangeLog row news triage wrote for this card, through core/revert.js, whose own check needs the Undo tier on the Next Season Draft page.
async function undoDraft(interaction, cardId) {
    const NewsCard = require('../models/NewsCard');
    const card = await NewsCard.findById(cardId).lean().catch(() => null);
    if (!card?.draftChangeId) return interaction.editReply({ content: 'Nothing on this card was written to the draft.' });
    if (card.draftUndone) return interaction.editReply({ content: 'Already undone.' });
    const res = await require('../core/revert').revertChange(card.draftChangeId, { actorId: interaction.user.id, source: 'discord' });
    if (!res.ok) return interaction.editReply({ content: res.reason || 'The undo could not be applied.' });
    await NewsCard.updateOne({ _id: cardId }, { $set: { draftUndone: true } }).catch(() => {});
    const fresh = await NewsCard.findById(cardId).lean().catch(() => null);
    if (fresh) await require('../utils/newsTriage/pipeline').redrawCard(interaction.client.rest, fresh, interaction.applicationId);
    return interaction.editReply({ content: 'Undone: the Next Season Draft is back to how it was before this card, apart from anything changed since.' });
}

// The briefing's "Kinds never drafted" dropdown (2026-11-05 15:23 EST, his pick 3): saved for anyone who can write the Next Season Draft, since it decides what news triage writes there.
async function setKinds(interaction) {
    const res = await require('../utils/manageActions').resolveAction('seasondraft', 'bulkcalendar', interaction.user.id);
    if (!res.ok) return speak(interaction, 'reply', res.message || 'You do not have access to the Next Season Draft.');
    const { KIND_GROUPS } = require('../utils/newsTriage/draftMerge');
    const keys = (interaction.values || []).filter(k => KIND_GROUPS[k]);
    await require('../models/BotControls').updateOne({ _id: 'global' }, { $set: { newsSkipKinds: keys } }, { upsert: true });
    await speak(interaction, 'reply', keys.length ? `Saved. Never drafted: ${keys.map(k => KIND_GROUPS[k].label).join(' · ')}.` : 'Saved. Every kind is drafted now.');
}

// "Make a card from one of these…" on the skipped list: read the post again and card it whatever the filter said.
async function makeCard(interaction) {
    const [channelId, messageId] = String(interaction.values?.[0] || '').split(':');
    const pipeline = require('../utils/newsTriage/pipeline');
    let message;
    try { message = await (await interaction.client.channels.fetch(channelId)).messages.fetch(messageId); } catch { message = null; }
    if (!message) return interaction.editReply({ content: 'That post could not be read: it may have been deleted.' });
    // actorId: the draft write is checked against this admin's own tier, never the owner's.
    const result = await pipeline.processPost(pipeline.toPost(message), { rest: interaction.client.rest, selfId: interaction.client.user?.id, appId: interaction.applicationId, force: true, actorId: interaction.user.id });
    const say = {
        carded: result.drafted ? `Card posted; ${result.drafted} item(s) written to the Next Season Draft.` : 'Card posted.',
        'already carded': 'That post already has a card.',
        'no card': `The AI found nothing to add (${result.reason || 'no items'}).`,
        error: `The AI read failed: ${result.error || 'unknown error'}.`,
        paused: 'AI reads are paused for an hour after errors.',
    }[result.status] || `Nothing posted (${result.status}).`;
    return interaction.editReply({ content: say });
}

async function handleNewsInteraction(interaction) {
    if (typeof interaction.customId !== 'string' || !interaction.customId.startsWith('news|')) return false;
    const [, action, cardId, index] = interaction.customId.split('|');
    // A box opener cannot be deferred (showModal must be the first answer), so it checks access and opens as fast as it can.
    if (interaction.isButton() && action === 'go') {
        if (!(await allowed(interaction))) return true;
        await openItem(interaction, cardId, Number(index));
        return true;
    }
    // Everything else is acknowledged first, then checked and run. Each branch names its own interaction type: this module serves buttons and selects (the router's mixed-type rule).
    let route = null;
    if (interaction.isButton() && action === 'dismiss') route = { ack: 'update', run: dismiss };
    else if (interaction.isButton() && action === 'undo') route = { ack: 'reply', run: undoDraft };
    else if (interaction.isStringSelectMenu() && action === 'make') route = { ack: 'reply', run: makeCard };
    else if (interaction.isStringSelectMenu() && action === 'kinds') route = { ack: 'reply', run: setKinds };
    if (!route) return false;
    if (!(await ackFirst(interaction, route.ack))) return true;
    await guarded(interaction, route.ack, async () => {
        if (!(await allowed(interaction, route.ack))) return;
        await route.run(interaction, cardId);
    });
    return true;
}

module.exports = { handleNewsInteraction, OWNED_PREFIXES };
