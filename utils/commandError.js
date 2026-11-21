// utils/commandError.js What a person sees when their command, button or form fails (added 2026-11-21 12:19 EST, Harkirat: "look into the eyes of a user…what if a command fails for them, what do they do next??"). It used to be the bare line "There was an error executing this command!": no reason, nothing to try, no way to tell anyone, so a new user's only move was to give up. Now: whose fault it is (ours), what to try, a Report button that opens /help's Bugs & Suggestions form, and a short Ref that matches the error line and the alert (the last 6 characters of the interaction id). When utils/restGuard.js knows Discord calls are failing right now, the note says so instead of suggesting a retry that cannot work yet. Sent with discord.js's own reply/editReply/followUp, which carry no bot token, so the note still reaches the person while the bot token is wiped (the 2026-11-21 09:52 EST outage: the old bare line did reach him, every panel did not).
const emojis = require('./emojiMap');
const { FEEDBACK_BUTTON_ID } = require('./feedback');

function errorRef(interaction) {
    const id = String(interaction?.id || '');
    return id ? id.slice(-6) : null;
}

// `label` is how the thing they used is named: `/timestamp`, `Convert Times`, or "that button".
function failureText(label, ref, { trouble = false } = {}) {
    const what = trouble
        ? `Dioreo is having trouble reaching Discord right now, so ${label} didn't work. It's on our side; try again in a few minutes.`
        : `Something went wrong on our side with ${label}. Try again in a minute. If it keeps failing, tap **Report** so we can look.`;
    return `${emojis.warn} ${what}${ref ? `\n-# Ref \`${ref}\`` : ''}`;
}

function reportRow() {
    return { type: 1, components: [{ type: 2, style: 2, label: 'Report', custom_id: FEEDBACK_BUTTON_ID, emoji: emojis.parseEmoji(emojis.feedback) }] };
}

// Answers in the reply when it can (a deferred command), privately otherwise, and falls back to a private follow-up when the reply cannot take plain text (a Components V2 message already went out). Never throws. Returns how it answered, or null.
async function tellUserItFailed(interaction, label) {
    if (!interaction || interaction.isAutocomplete?.()) return null;
    let trouble = false;
    try { trouble = require('./restGuard').inTrouble(); } catch { /* no state yet */ }
    const payload = { content: failureText(label, errorRef(interaction), { trouble }), components: [reportRow()], allowedMentions: { parse: [] } };
    // A button, menu or form: never edit — its "reply" is the panel itself, and the note would wipe the panel out. A private follow-up (or reply) sits under it instead.
    const onPanel = Boolean(interaction.isMessageComponent?.() || interaction.isModalSubmit?.());
    try {
        if (onPanel) {
            if (interaction.deferred || interaction.replied) { await interaction.followUp({ ...payload, flags: 64 }); return 'followup'; }
            await interaction.reply({ ...payload, flags: 64 });
            return 'replied';
        }
        if (interaction.deferred || interaction.replied) { await interaction.editReply(payload); return 'edited'; }
        await interaction.reply({ ...payload, flags: 64 });
        return 'replied';
    } catch {
        try { await interaction.followUp({ ...payload, flags: 64 }); return 'followup'; }
        catch (err) { console.error(`Could not tell the user that ${label} failed (the interaction likely expired):`, err?.message || err); return null; }
    }
}

// The Ref a Report button's message carries, so the owner's feedback card can name the failure it came from.
function refFromMessage(message) {
    const m = /Ref `([A-Za-z0-9]{1,20})`/.exec(String(message?.content || ''));
    return m ? m[1] : null;
}

module.exports = { errorRef, failureText, reportRow, tellUserItFailed, refFromMessage };
