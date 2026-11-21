// utils/commandError.js What a person sees when their command, button or form fails (added 2026-11-21 12:19 EST, Harkirat: "look into the eyes of a user…what if a command fails for them, what do they do next??"). It used to be the bare line "There was an error executing this command!": no reason, nothing to try, no way to tell anyone, so a new user's only move was to give up. Now: whose fault it is (ours), what to try, a Report button that opens /help's Bugs & Suggestions form, and a short Ref that matches the error line and the alert (the last 6 characters of the interaction id). When utils/restGuard.js knows Discord calls are failing right now, the note says so instead of suggesting a retry that cannot work yet. Sent with discord.js's own reply/editReply/followUp, which carry no bot token, so the note still reaches the person while the bot token is wiped (the 2026-11-21 09:52 EST outage: the old bare line did reach him, every panel did not).
const emojis = require('./emojiMap');
const { FEEDBACK_BUTTON_ID } = require('./feedback');

function errorRef(interaction) {
    const id = String(interaction?.id || '');
    return id ? id.slice(-6) : null;
}

// `name` is what they used, plain: `/timestamp`, `Convert Times`, or null for a button, menu or form ("That"). Layout A, his pick of two shown in #testing-spam (2026-11-21 12:36 EST), with the Ref on the hint line (his "A but put the Ref 456789 line with the report line"): a bold title naming what failed, one line on whose fault it is, and a small line with what to try and the Ref. The first round, a single long line, was "very long as 1 line".
function failureText(name, ref, { trouble = false } = {}) {
    const lines = [
        `${emojis.warn} **${name || 'That'} didn't work**`,
        trouble ? 'Dioreo is having trouble reaching Discord right now.' : 'Something went wrong on our side, not yours.',
        (trouble ? "-# It's on our side. Try again in a few minutes." : '-# Try again in a minute. Still failing? Tap **Report**.') + (ref ? ` · Ref \`${ref}\`` : ''),
    ];
    return lines.join('\n');
}

function reportRow() {
    return { type: 1, components: [{ type: 2, style: 2, label: 'Report', custom_id: FEEDBACK_BUTTON_ID, emoji: emojis.parseEmoji(emojis.feedback) }] };
}

// Answers in the reply when it can (a deferred command), privately otherwise, and falls back to a private follow-up when the reply cannot take plain text (a Components V2 message already went out). Never throws. Returns how it answered, or null.
async function tellUserItFailed(interaction, label, error = null) {
    if (!interaction || interaction.isAutocomplete?.()) return null;
    // Discord already closed this interaction (10062 too slow, 40060 already answered): nothing can reach the person, so don't try (2026-11-21 13:14 EST).
    if (expiredError(error)) return null;
    let trouble = false;
    try { trouble = require('./restGuard').inTrouble(); } catch { /* no state yet */ }
    const payload = { content: failureText(label, errorRef(interaction), { trouble }), components: [reportRow()], allowedMentions: { parse: [] } };
    // A button, menu or form: never edit — its "reply" is the panel itself, and the note would wipe the panel out. A private follow-up (or reply) sits under it instead.
    // And a command whose answer already went out (discord.js `replied`, or sendV2Payload's raw send marking `__dioreoAnswered`) is treated the same way (2026-11-21 13:14 EST): something failing after the answer must not replace a working answer with "didn't work".
    const onPanel = Boolean(interaction.isMessageComponent?.() || interaction.isModalSubmit?.() || interaction.replied || interaction.__dioreoAnswered);
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

// Discord's own "this interaction is closed" codes: 10062 (not answered within 3 seconds) and 40060 (already answered). Expected now and then, never a reason to alert or to try another reply.
const expiredError = (err) => Boolean(err && (err.code === 10062 || err.code === 40060));

// The Ref a Report button's message carries, so the owner's feedback card can name the failure it came from.
function refFromMessage(message) {
    const m = /Ref `([A-Za-z0-9]{1,20})`/.exec(String(message?.content || ''));
    return m ? m[1] : null;
}

module.exports = { errorRef, failureText, reportRow, tellUserItFailed, refFromMessage, expiredError };
