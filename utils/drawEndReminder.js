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

// The calendar row that gives a returning draw its end date, if one exists yet.
const calendarRowFor = (seasonalDoc, title) => (seasonalDoc?.calendar || []).find(e => e.category === 'draw' && isSameDrawTitle(e.title, title)) || null;

// /draws' own accent (commands/draws.js's PRESET_ACCENT, Plum Fortune), so the card reads as a Draws message (2026-10-21 14:50 EDT, Harkirat: "Add the draws accent color to it").
const DRAWS_ACCENT = 7032445;
const unix = date => Math.floor(new Date(date).getTime() / 1000);

// The DM: a Components V2 card, one Section per draw. It is redrawn from the database after every end date he sets (2026-10-21 14:52 EDT, Harkirat: "can it update its embed message instead of an ephemeral? (While keeping the edit button active incase I want to update it later again)"), so a draw with an end date shows it and keeps a Change End Date button. The button carries /manage's DB_Edit emoji because it writes to the database (his ask, 14:50 EDT).
function reminderComponents(draws, seasonalDoc = {}) {
    const emojis = require('./emojiMap');
    const rows = draws.map(d => ({ draw: d, row: calendarRowFor(seasonalDoc, d.title) }));
    const pending = rows.filter(r => !r.row?.endDate).length;
    const plural = draws.length !== 1;
    const heading = pending
        ? `### 🔔 ${pending === 1 ? 'A returning draw needs' : `${pending} returning draws need`} an end date`
        : `### ${emojis.checkmark} End ${plural ? 'dates' : 'date'} saved`;
    const hint = pending
        ? `-# /calendar can't mark ${pending === 1 ? 'it' : 'them'} finished until then. Check the draw in-game for when it ends.`
        : `-# /calendar now shows when ${plural ? 'they end' : 'it ends'}. If the game changes it, change it here.`;
    return [{
        type: 17,
        accent_color: DRAWS_ACCENT,
        components: [
            { type: 10, content: `${heading}\n${hint}` },
            { type: 14, divider: true, spacing: 1 },
            ...rows.map(({ draw, row }) => ({
                type: 9,
                components: [{ type: 10, content: row?.endDate
                    ? `**${draw.title}**\n-# Ends <t:${unix(row.endDate)}:D> · <t:${unix(row.endDate)}:R>`
                    : `**${draw.title}**\n-# Back since <t:${unix(draw.date)}:D> · no end date yet` }],
                accessory: { type: 2, style: row?.endDate ? 2 : 1, label: row?.endDate ? 'Change End Date' : 'Set End Date', custom_id: drawEndCustomId(draw.title), emoji: emojis.parseEmoji(emojis.mngEdit) }
            }))
        ]
    }];
}

// Every Set End Date button on a message, read back to its draw. Takes discord.js components or raw JSON.
function drawsOnMessage(seasonalDoc, message) {
    const ids = [];
    const walk = c => {
        if (!c) return;
        const json = typeof c.toJSON === 'function' ? c.toJSON() : c;
        if (typeof json.custom_id === 'string' && json.custom_id.startsWith('mng_drawend_')) ids.push(json.custom_id);
        walk(json.accessory);
        (json.components || []).forEach(walk);
    };
    (message?.components || []).forEach(walk);
    const draws = ids.map(id => drawForEndCustomId(seasonalDoc, id)).filter(Boolean);
    return draws.filter((d, i) => draws.indexOf(d) === i);
}

// True when a modal was opened from the reminder card, so its submit redraws the card instead of answering privately.
const isReminderMessage = message => JSON.stringify((message?.components || []).map(c => (typeof c.toJSON === 'function' ? c.toJSON() : c))).includes('"mng_drawend_');

// Redraw the card a Set/Change End Date submit came from. The submit was answered with deferUpdate, so @original is the card itself. Returns false when none of its draws is left, so the caller can answer the old way.
async function refreshReminderMessage(interaction) {
    const SeasonalData = require('../models/SeasonalData');
    const { Routes } = require('discord.js');
    const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
    const draws = doc ? drawsOnMessage(doc, interaction.message) : [];
    if (!draws.length) return false;
    await interaction.client.rest.patch(Routes.webhookMessage(interaction.applicationId, interaction.token), { body: { components: reminderComponents(draws, doc), allowed_mentions: { parse: [] } } });
    return true;
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
        await client.rest.post(Routes.channelMessages(dm.id), { body: { flags: 32768, allowed_mentions: { parse: [] }, components: reminderComponents(due, doc) } });
        const current = new Set((doc.returningDraws || []).map(d => key(d.title)));
        const kept = (doc.drawEndReminders || []).filter(k => current.has(k));
        await SeasonalData.updateOne({ docType: 'global' }, { $set: { drawEndReminders: [...new Set([...kept, ...due.map(d => key(d.title))])] } });
        console.log(`🔔 Draw end-date reminder sent for ${due.length} returning draw(s).`);
    } catch (error) {
        console.error(`Draw end-date reminder failed (will retry next run): ${error?.message || 'Unknown error'}`);
    }
}

module.exports = { drawsNeedingEndDate, reminderComponents, drawForEndCustomId, drawEndCustomId, drawsOnMessage, isReminderMessage, refreshReminderMessage, calendarRowFor, runDrawEndReminders, msUntilNextDailyRun, REMIND_WINDOW_DAYS };
