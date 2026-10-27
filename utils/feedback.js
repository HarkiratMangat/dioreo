// utils/feedback.js -- /help's "Bugs & Suggestions" (Harkirat, 2026-10-27 01:20 EDT: "a 'bugs & suggestions' button which opens a modal to submit any bug reports, give feedback, or any ideas/suggestions/feature requests, etc. which the dioreo admin bot then sends me in my DM, including who sent it").
//
// The button on /help's landing opens a pop-up (what kind, the message, an optional screenshot), and Dioreo Admin DMs it to the owner through utils/buildSubmissions.js's dmOwner, the same route Submit a Build uses.
//
// ⚠️ A PROACTIVE DM to the OWNER, the fifth exception to CLAUDE.md's "answers ONLY through interactions" invariant. Never a channel, never anyone else, no allowed mentions. Nothing is stored: the DM is the only copy (PRIVACY.md §2.1g). One per person every 10 minutes, held in memory only, so a restart resets it.
const emojis = require('./emojiMap');

const FEEDBACK_BUTTON_ID = 'help_feedback';
const FEEDBACK_MODAL_ID = 'help_fbsave';
const RATE_MS = 10 * 60 * 1000;
const KINDS = [
    { value: 'bug', label: 'Bug report', heading: 'Bug report' },
    { value: 'feedback', label: 'Feedback', heading: 'Feedback' },
    { value: 'idea', label: 'Idea or feature request', heading: 'Idea' },
];
const label = (text, description, component) => ({ type: 18, label: text, ...(description ? { description } : {}), component });
const lastSent = new Map();

function feedbackModal() {
    return {
        title: 'Bugs & Suggestions', custom_id: FEEDBACK_MODAL_ID,
        components: [
            label('What is it?', null, { type: 3, custom_id: 'kind', required: true, min_values: 1, max_values: 1, options: KINDS.map(k => ({ label: k.label, value: k.value })) }),
            label('Tell us', 'What happened, what you expected, or what you would like to see', { type: 4, custom_id: 'message', style: 2, required: true, min_length: 5, max_length: 2000 }),
            label('Screenshot', 'Optional', { type: 19, custom_id: 'shot', min_values: 0, max_values: 1, required: false }),
        ],
    };
}

// The owner's DM card: what kind, who sent it and when, then their words as a quote. `imageUrl` is the screenshot re-sent with the DM.
function feedbackCard({ kind, message, userId, username, sentAt = new Date() }, imageUrl = null) {
    const k = KINDS.find(x => x.value === kind) || KINDS[1];
    const when = Math.floor(new Date(sentAt).getTime() / 1000);
    const parts = [
        { type: 10, content: `## ${k.heading}\n-# From <@${userId}> · \`${username}\` · <t:${when}:R>` },
        { type: 14, spacing: 1, divider: true },
        { type: 10, content: String(message).split('\n').map(l => `> ${l}`).join('\n') },
    ];
    if (imageUrl) parts.push({ type: 14, spacing: 1, divider: false }, { type: 12, items: [{ media: { url: imageUrl } }] });
    return [{ type: 17, components: parts }];
}

// Seconds-epoch when this person may send again, or null.
function waitUntil(userId, now = Date.now()) {
    const last = lastSent.get(userId);
    return last && now - last < RATE_MS ? Math.floor((last + RATE_MS) / 1000) : null;
}

async function openFeedback(interaction) {
    const wait = waitUntil(interaction.user.id);
    if (wait) {
        try { await interaction.reply({ content: `${emojis.cross} You can send one every 10 minutes. Try again <t:${wait}:R>.`, flags: 64 }); } catch (e) { console.error('Failed to answer a rate-limited feedback click:', e); }
        return;
    }
    await interaction.showModal(feedbackModal());
}

async function handleFeedbackSave(interaction) {
    const { dmOwner, fileFrom, oneAtATime } = require('./buildSubmissions');
    return oneAtATime(interaction, async () => {
        const wait = waitUntil(interaction.user.id);
        if (wait) {
            try { await interaction.reply({ content: `${emojis.cross} You can send one every 10 minutes. Try again <t:${wait}:R>.`, flags: 64 }); } catch (e) { console.error('Failed to answer a rate-limited feedback send:', e); }
            return;
        }
        await interaction.deferReply({ flags: 64 });
        let kind = 'feedback', message = '';
        try { kind = interaction.fields.getStringSelectValues('kind')[0] || kind; } catch { /* keeps the default */ }
        try { message = (interaction.fields.getTextInputValue('message') || '').trim(); } catch { message = ''; }
        const shot = await fileFrom(interaction, 'shot');
        try {
            const card = { kind, message, userId: interaction.user.id, username: interaction.user.username };
            await dmOwner(() => ({ flags: 32768, components: feedbackCard(card, shot ? `attachment://${shot.name}` : null) }), shot ? [shot] : []);
        } catch (err) {
            console.error('Could not DM the owner a feedback note:', err?.message || err);
            await interaction.editReply({ content: `${emojis.cross} That could not be sent just now. Please try again later.` });
            return;
        }
        lastSent.set(interaction.user.id, Date.now());
        await interaction.editReply({ content: `${emojis.checkmark} Sent to Dioreo's developer, thanks!` });
    });
}

module.exports = { FEEDBACK_BUTTON_ID, FEEDBACK_MODAL_ID, KINDS, RATE_MS, feedbackModal, feedbackCard, waitUntil, openFeedback, handleFeedbackSave, _lastSent: lastSent };
