// utils/textCommands/spamLadder.js -- the spam ladder for text commands (B7, 2026-10-30; his ask 2026-10-29 15:06 EDT, approved as B7's starting spec 15:35 EDT: "yes approved". Every rule below is in the text-commands plan's "B7 spec" §3, with his words).
//
// THE SCORE: per person, across every server and every text command, over a rolling 60 s: a reply Dioreo posted for them is 1 point, a 5-second warning 3. Reaching 10 starts a penalty, and the event that reached it gets the penalty note instead of its own answer. Measured with the real listener in B6 (15:28 EDT): an explorer's 6-9 commands stay under it; one command a second reaches it in about 10 s; the same command repeated, in about 15 s. Different commands only 1 s apart never get a warning, which is why a reply counts at all (his 15:21 EDT: "the count needs to accomidate for same command spam and multi command spam"). The numbers are named constants because he was unsure of them ("i think so? idk", 15:30 EDT), to be tuned on the dev bot.
// THE RUNGS: 1 m, 5 m, 15 m, 1 h, 6 h, then 12 h, the cap. The step is held in memory and starts over at 00:00 UTC, the game's daily update ("the window for offenses resets daily"); a running penalty runs out rather than being pardoned at midnight.
// EVERYWHERE, not per server (his 15:35 EDT: "what if they're hijacked by a bot?"). The owner is never penalised, so testing on prod never locks him out.
// THE PENALTY is stored (models/TextPenalty.js), deleted when it ends. During it: ONE note, "You're on cooldown for spamming! Try again <t:R>", left up as the countdown and deleted when it ends (his 15:15 EDT: "send it once and don't delete it, this way it can be used as their countdown timer"), then silence. A press on one of Dioreo's cards gets a private line only from the 5-minute rung up (15:34 EDT). Dioreo Admin DMs the owner at the 6 h and 12 h rungs (15:35 EDT, "yes"). /bot penalties lists and lifts them ("sure + a user id direct method", 15:19 EDT).
const { Routes } = require('discord.js');

const MINUTE = 60_000;
const SCORE_WINDOW_MS = 60 * 1000;
// The points, the limit and the rungs are the owner's to tune live in /bot penalties (his ask, 2026-10-30 12:55 EDT, built in B7): utils/botControls.js holds them, its DEFAULT_SPAM is 1 / 3 / 10 and 1 m, 5 m, 15 m, 1 h, 6 h, 12 h, and the exported REPLY_POINTS, WARNING_POINTS, PENALTY_SCORE and RUNGS_MS below read the live values.
const tuned = () => require('../botControls').spam();
const rungsMs = () => tuned().rungsMin.map(m => m * MINUTE);
const PRESS_NOTE_FROM_MS = 5 * MINUTE;
const OWNER_DM_FROM_MS = 6 * 60 * MINUTE;
// The record outlives its penalty by a day: the bot deletes it itself (note first, then record), and the TTL only catches one it missed. A TTL alone would leave a 12 h countdown note up for good if the bot was down when the penalty ended (B6's think-pass, 2026-10-29 15:31 EDT).
const RECORD_GRACE_MS = 24 * 60 * MINUTE;

const scores = new Map();
const steps = new Map();
const active = new Map();
const timers = new Map();
// The public app, which posts the notes and so is the one that can delete them; set on load and on every penalty, so a lift from Dioreo Admin deletes with the right client.
let noteClient = null;

const isOwner = id => require('../owner').isOwnerId(id);
const utcDay = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
function rungMs(p) {
    const r = rungsMs();
    return r[Math.min(Math.max(p.step, 1), r.length) - 1];
}
const model = () => require('../../models/TextPenalty');

// The person's running penalty, or null. One that is past its end counts as over even before its timer has fired.
function penaltyFor(userId, now = Date.now()) {
    const p = active.get(userId);
    return p && p.until > now ? p : null;
}

const blocksPresses = p => rungMs(p) >= PRESS_NOTE_FROM_MS;
function pressNote(p) {
    const { cooldown } = require('../emojiMap');
    return `${cooldown} You're on cooldown for spamming! Try again <t:${Math.ceil(p.until / 1000)}:R>`;
}

// Adds an event's points; true when this event reaches the limit (the score then starts over).
function addPoints(userId, points, now = Date.now()) {
    // The owner, and anyone he exempted in /bot penalties (his "keep", 2026-10-30 13:18 EDT), never score.
    if (isOwner(userId) || require('../botControls').isExempt(userId)) return false;
    const list = (scores.get(userId) || []).filter(e => now - e.at < SCORE_WINDOW_MS);
    list.push({ at: now, points });
    if (list.reduce((n, e) => n + e.points, 0) >= tuned().threshold) {
        scores.delete(userId);
        return true;
    }
    scores.set(userId, list);
    return false;
}

// The rung this penalty is on: one up from today's last, the 12 h cap held.
function nextStep(userId, now = Date.now()) {
    const day = utcDay(now);
    const held = steps.get(userId);
    const step = Math.min((held && held.day === day ? held.step : 0) + 1, rungsMs().length);
    steps.set(userId, { step, day });
    return step;
}

function arm(userId, entry) {
    clearTimeout(timers.get(userId));
    const timer = setTimeout(() => { endPenalty(userId).catch(() => {}); }, Math.max(0, entry.until - Date.now()));
    timer.unref?.();
    timers.set(userId, timer);
}

async function save(userId, entry) {
    try {
        await model().updateOne({ discordId: userId }, { $set: { step: entry.step, until: new Date(entry.until), guildId: entry.guildId, channelId: entry.channelId, noteMessageId: entry.noteMessageId, expireAt: new Date(entry.until + RECORD_GRACE_MS) } }, { upsert: true });
    } catch (err) {
        console.error(`Spam penalty: could not store ${userId}'s:`, err?.message || err);
    }
}

// Starts the next rung for the author of `message`, posts the countdown note where they spammed (as a reply to that message), stores it, and tells the owner at 6 h or more. Returns the penalty, or null for the owner or someone already serving one.
async function startPenalty(message, { canPost = true, now = Date.now() } = {}) {
    const userId = message.author.id;
    if (isOwner(userId) || penaltyFor(userId, now)) return null;
    noteClient = message.client;
    const step = nextStep(userId, now);
    const entry = { userId, step, until: now + rungsMs()[step - 1], guildId: message.guildId || null, channelId: message.channelId || null, noteMessageId: null };
    active.set(userId, entry);
    arm(userId, entry);
    if (canPost && entry.channelId) {
        const route = Routes.channelMessages(entry.channelId);
        const body = { content: `-# ${pressNote(entry)}`, allowed_mentions: { parse: [], replied_user: false } };
        // A reply needs Read Message History; without it the note goes out as a plain message, as every other text reply does.
        const note = await message.client.rest.post(route, { body: { ...body, message_reference: { message_id: message.id, fail_if_not_exists: false } } })
            .catch(err => (err?.code === 50013 ? message.client.rest.post(route, { body }).catch(() => null) : null));
        entry.noteMessageId = note?.id || null;
    }
    await save(userId, entry);
    if (rungMs(entry) >= OWNER_DM_FROM_MS) notifyOwner(message, entry);
    return entry;
}

// Dioreo Admin's DM to the owner at the 6 h and 12 h rungs. Never awaited by the listener, never throws.
function notifyOwner(message, entry) {
    const hours = Math.round(rungMs(entry) / (60 * MINUTE));
    const server = message.guild?.name ? ` in **${message.guild.name.replace(/[`*_~|]/g, '')}**` : '';
    require('../buildSubmissions').dmOwner(() => {
        const { warn } = require('../emojiMap');
        return { content: `${warn} **Spam penalty: ${hours} h** · <@${entry.userId}> (\`${entry.userId}\`)${server}\n-# Ends <t:${Math.ceil(entry.until / 1000)}:R> · lift it with /bot penalties` };
    }).catch(err => console.error('Spam penalty: could not DM the owner:', err?.message || err));
}

// Ends a penalty: the note first, then the record (B6's think-pass order). `lift` also forgets today's rung and score, since a lift is a pardon. Returns true when there was one.
async function endPenalty(userId, { lift = false, client = null } = {}) {
    const entry = active.get(userId);
    clearTimeout(timers.get(userId));
    timers.delete(userId);
    active.delete(userId);
    if (lift) { steps.delete(userId); scores.delete(userId); }
    const rest = (client || noteClient)?.rest;
    if (entry?.noteMessageId && entry.channelId && rest) await rest.delete(Routes.channelMessage(entry.channelId, entry.noteMessageId)).catch(() => {});
    await model().deleteOne({ discordId: userId }).catch(err => console.error(`Spam penalty: could not delete ${userId}'s:`, err?.message || err));
    return Boolean(entry);
}

const liftPenalty = (userId, opts = {}) => endPenalty(userId, { ...opts, lift: true });

// The owner's Extend (/bot penalties, his layout 2026-10-30 13:26 EDT: "remove it or extend it or whatever"): the next rung up from the running one, or `ms` from now. The countdown note is edited to the new end, so it never shows a time that is no longer true. Returns the entry, or null when none is running.
async function extendPenalty(userId, { ms = null, now = Date.now(), client = null } = {}) {
    const entry = penaltyFor(userId, now);
    if (!entry) return null;
    if (ms == null) {
        const r = rungsMs();
        entry.step = Math.min(entry.step + 1, r.length);
        steps.set(userId, { step: entry.step, day: utcDay(now) });
        ms = r[entry.step - 1];
    }
    entry.until = now + ms;
    arm(userId, entry);
    const rest = (client || noteClient)?.rest;
    if (entry.noteMessageId && entry.channelId && rest) await rest.patch(Routes.channelMessage(entry.channelId, entry.noteMessageId), { body: { content: `-# ${pressNote(entry)}` } }).catch(() => {});
    await save(userId, entry);
    return entry;
}

// The rung the person reached today (0 when none), for /bot penalties.
function stepToday(userId, now = Date.now()) {
    const s = steps.get(userId);
    return s && s.day === utcDay(now) ? s.step : 0;
}
async function liftAll(opts = {}) {
    const ids = [...active.keys()];
    for (const id of ids) await liftPenalty(id, opts);
    return ids.length;
}

// Every running penalty, soonest to end first.
const listActive = (now = Date.now()) => [...active.values()].filter(p => p.until > now).sort((a, b) => a.until - b.until);

// At start-up, from the public client: re-arms every running penalty (its rung kept for the rest of the day), and ends any that ran out while the bot was down, deleting their notes.
async function loadPenalties(client) {
    noteClient = client;
    let rows = [];
    try { rows = await model().find({}).lean(); } catch (err) { console.error('Spam penalty: could not load:', err?.message || err); return 0; }
    const now = Date.now();
    for (const r of rows) {
        const entry = { userId: r.discordId, step: r.step, until: new Date(r.until).getTime(), guildId: r.guildId || null, channelId: r.channelId || null, noteMessageId: r.noteMessageId || null };
        active.set(entry.userId, entry);
        if (entry.until > now) {
            steps.set(entry.userId, { step: entry.step, day: utcDay(now) });
            arm(entry.userId, entry);
        } else {
            await endPenalty(entry.userId);
        }
    }
    return rows.length;
}

// Keeps the in-memory maps small (called by the listener's ten-minute sweep).
function sweep(now = Date.now()) {
    for (const [k, list] of scores) if (!list.some(e => now - e.at < SCORE_WINDOW_MS)) scores.delete(k);
    const day = utcDay(now);
    for (const [k, s] of steps) if (s.day !== day && !active.has(k)) steps.delete(k);
}

module.exports = { penaltyFor, blocksPresses, pressNote, addPoints, startPenalty, endPenalty, liftPenalty, extendPenalty, stepToday, rungMs, liftAll, listActive, loadPenalties, sweep, SCORE_WINDOW_MS, PRESS_NOTE_FROM_MS, OWNER_DM_FROM_MS };
// Read live, so a value the owner just tuned is the one the listener uses next.
Object.defineProperties(module.exports, {
    REPLY_POINTS: { enumerable: true, get: () => tuned().reply },
    WARNING_POINTS: { enumerable: true, get: () => tuned().warning },
    PENALTY_SCORE: { enumerable: true, get: () => tuned().threshold },
    RUNGS_MS: { enumerable: true, get: rungsMs },
});
