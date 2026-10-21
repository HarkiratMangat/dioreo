// utils/drawEndReminder.js
// ==========================================
// RETURNING DRAW END-DATE REMINDER -- a DM to the owner
// ==========================================
// Harkirat, 2026-10-21 14:39 EDT: "Can you build a system where the bot DMs me to remind me that when a returning draw is live, to go check the game for the end date and update it into the bots data?" A returning draw is stored with its release date only, so /calendar can never show it as finished; a Draws row with an end date (/manage → Calendar, or the portal) is what lets it go red. This tells him the moment one goes live without one.
//
// ⚠️ THE ONE PROACTIVE MESSAGE THE BOT SENDS, AND ONLY TO THE OWNER. CLAUDE.md's "answers ONLY through interactions" invariant names it as its second deliberate exception (after utils/discordCdnStorage.js): a DM to ALLOWED_ADMIN_ID, never a channel, never another user. The bot shares Harkirat's server, which is what lets it open the DM.
//
// Runs hourly from bot/lifecycle.js. Each draw is reminded about once: its title goes into SeasonalData.drawEndReminders, trimmed to the titles still in returningDraws so a new season starts clean. Only draws released in the last REMIND_WINDOW_DAYS count, so the first run after a deploy cannot send a backlog of last season's draws.
const { ALLOWED_ADMIN_ID } = require('./owner');
const { isSameDrawTitle } = require('./search');

const REMIND_WINDOW_DAYS = 7;
const key = title => String(title || '').trim().toLowerCase();

// The returning draws that are live, have no calendar row giving them an end date, were released within the window, and were never reminded about.
function drawsNeedingEndDate(seasonalDoc, nowMs = Date.now()) {
    const explicitWithEnd = (seasonalDoc.calendar || []).filter(e => e.category === 'draw' && e.endDate);
    const reminded = new Set(seasonalDoc.drawEndReminders || []);
    const windowStart = nowMs - REMIND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    return (seasonalDoc.returningDraws || []).filter(d => {
        const released = d.date ? new Date(d.date).getTime() : NaN;
        return Number.isFinite(released) && released <= nowMs && released >= windowStart
            && !explicitWithEnd.some(e => isSameDrawTitle(e.title, d.title))
            && !reminded.has(key(d.title));
    });
}

function reminderText(draws) {
    const lines = draws.map(d => `- **${d.title}** · returned <t:${Math.floor(new Date(d.date).getTime() / 1000)}:R>`);
    return `### 🔔 Returning ${draws.length === 1 ? 'draw is' : 'draws are'} live with no end date\n${lines.join('\n')}\n-# Check the game for when ${draws.length === 1 ? 'it ends' : 'they end'}, then add a Draws row with the end date in /manage → Calendar (or the portal). Until then /calendar can't show ${draws.length === 1 ? 'it' : 'them'} as finished.`;
}

// Never throws: a failed DM is logged and retried on the next run, since nothing is marked reminded until the DM has gone.
async function runDrawEndReminders(client) {
    try {
        const SeasonalData = require('../models/SeasonalData');
        const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
        if (!doc) return;
        const due = drawsNeedingEndDate(doc);
        if (!due.length) return;
        const owner = await client.users.fetch(ALLOWED_ADMIN_ID);
        await owner.send({ content: reminderText(due), allowedMentions: { parse: [] } });
        const current = new Set((doc.returningDraws || []).map(d => key(d.title)));
        const kept = (doc.drawEndReminders || []).filter(k => current.has(k));
        await SeasonalData.updateOne({ docType: 'global' }, { $set: { drawEndReminders: [...new Set([...kept, ...due.map(d => key(d.title))])] } });
        console.log(`🔔 Draw end-date reminder sent for ${due.length} returning draw(s).`);
    } catch (error) {
        console.error(`Draw end-date reminder failed (will retry next run): ${error?.message || 'Unknown error'}`);
    }
}

module.exports = { drawsNeedingEndDate, reminderText, runDrawEndReminders, REMIND_WINDOW_DAYS };
