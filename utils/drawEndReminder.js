// utils/drawEndReminder.js
// ==========================================
// RETURNING DRAW END-DATE REMINDER -- a DM to the owner
// ==========================================
// Harkirat, 2026-10-21 14:39 EDT: "Can you build a system where the bot DMs me to remind me that when a returning draw is live, to go check the game for the end date and update it into the bots data?" A returning draw is stored with its release date only, so /calendar can never show it as finished; a Draws row with an end date (/manage → Calendar, or the portal) is what lets it go red. This tells him the moment one goes live without one.
//
// ⚠️ THE ONE PROACTIVE MESSAGE THE BOT SENDS, AND ONLY TO THE OWNER. CLAUDE.md's "answers ONLY through interactions" invariant names it as its second deliberate exception (after utils/discordCdnStorage.js): a DM to ALLOWED_ADMIN_ID, never a channel, never another user. The bot shares Harkirat's server, which is what lets it open the DM.
//
// Runs once a day from bot/lifecycle.js, five minutes after the game's 00:00 UTC update. Each draw is reminded about once: its title goes into SeasonalData.drawEndReminders, trimmed to the titles still in returningDraws so a new season starts clean. Only draws released in the last REMIND_WINDOW_DAYS count, so the first run after a deploy cannot send a backlog of last season's draws.
const { ALLOWED_ADMIN_ID } = require('./owner');
const { isSameDrawTitle } = require('./search');

const REMIND_WINDOW_DAYS = 7;
// The game's daily update is 00:00 UTC (8 PM Toronto in summer, 7 PM in winter); a draw dated that day is stored at that instant, so five minutes after it is the first moment it reads as released.
const DAILY_RUN_UTC_MINUTE = 5;
function msUntilNextDailyRun(nowMs = Date.now()) {
    const next = new Date(nowMs);
    next.setUTCHours(0, DAILY_RUN_UTC_MINUTE, 0, 0);
    if (next.getTime() <= nowMs) next.setUTCDate(next.getUTCDate() + 1);
    return next.getTime() - nowMs;
}
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

// The button on each draw (`mng_drawend_<title key>`) opens /manage's own Add Calendar Event box with the title and release date filled in, so the end date is the one thing left to type (2026-10-21 14:46 EDT, Harkirat: "No not as prose, as an actual embed where i can just interact with it directly, edit that particular draw and set the end date"). The `mng_` prefix puts it behind the router's /manage admin lock and handlers/manage/index.js answers it; the box's own submit is /manage's.
const drawEndCustomId = title => `mng_drawend_${key(title)}`.slice(0, 100);

// The DM: a Components V2 card, one Section per draw with its Set End Date button.
function reminderComponents(draws) {
    const emojis = require('./emojiMap');
    return [{
        type: 17,
        components: [
            { type: 10, content: `### 🔔 Returning ${draws.length === 1 ? 'draw is' : 'draws are'} live with no end date` },
            ...draws.map(d => ({
                type: 9,
                components: [{ type: 10, content: `**${d.title}**\n-# Returned <t:${Math.floor(new Date(d.date).getTime() / 1000)}:R>` }],
                accessory: { type: 2, style: 1, label: 'Set End Date', custom_id: drawEndCustomId(d.title), emoji: emojis.parseEmoji(emojis.edit) }
            })),
            { type: 10, content: `-# Check the game for when ${draws.length === 1 ? 'it ends' : 'they end'}, then set it here. Until then /calendar can't show ${draws.length === 1 ? 'it' : 'them'} as finished.` }
        ]
    }];
}

// The returning draw a Set End Date button points at, by its title key, or null if it has since been removed.
function drawForEndCustomId(seasonalDoc, customId) {
    const wanted = customId.slice('mng_drawend_'.length);
    return (seasonalDoc.returningDraws || []).find(d => drawEndCustomId(d.title) === customId || key(d.title).startsWith(wanted)) || null;
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
        const dm = await owner.createDM();
        // Raw REST, the same way sendV2Payload sends a Components V2 body: discord.js's own send() does not pass V2 JSON through.
        const { Routes } = require('discord.js');
        await client.rest.post(Routes.channelMessages(dm.id), { body: { flags: 32768, allowed_mentions: { parse: [] }, components: reminderComponents(due) } });
        const current = new Set((doc.returningDraws || []).map(d => key(d.title)));
        const kept = (doc.drawEndReminders || []).filter(k => current.has(k));
        await SeasonalData.updateOne({ docType: 'global' }, { $set: { drawEndReminders: [...new Set([...kept, ...due.map(d => key(d.title))])] } });
        console.log(`🔔 Draw end-date reminder sent for ${due.length} returning draw(s).`);
    } catch (error) {
        console.error(`Draw end-date reminder failed (will retry next run): ${error?.message || 'Unknown error'}`);
    }
}

module.exports = { drawsNeedingEndDate, reminderComponents, drawForEndCustomId, drawEndCustomId, runDrawEndReminders, msUntilNextDailyRun, REMIND_WINDOW_DAYS };
