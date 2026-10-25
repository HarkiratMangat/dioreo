// ==========================================
// REMINDERS — INTERACTION HANDLER
// ==========================================
// Every `remind_` id: the bell on a command's header and the DM's Manage reminders button (`remind_open`), the panel's category toggles, its two one-thing dropdowns, Search, Stop all, and Turn back on. Built 2026-10-23 from the agreed design (docs/superpowers/specs/2026-10-23-notifications-design.md); the logic lives in utils/reminders.js and the command in commands/remind.js.
//
// A PUBLIC PANEL IS LOCKED TO ITS OWNER (his round-4 Q1, 21:04 EDT): every panel id ends in the owner's user id, and anyone else pressing it gets a private "Open your own reminders" button instead of changing theirs. `remind_open` carries no owner: it always opens the presser's own panel, privately (his round-3 Q1 and Q5).
//
// ⚠️ THE CRASH NET IS THE ROUTER'S, NOT THIS FILE'S (.claude/rules/interaction-router.md): no try/catch that swallows, no listeners, every error reply awaited. And this module serves buttons, a select and a modal submit, so every branch type-tests the interaction (the set_page_2 bug of 2026-08-13).

const { sendV2Payload } = require('../utils/sendV2Payload');
const emojis = require('../utils/emojiMap');
const R = require('../utils/reminders');

const OWNED_PREFIXES = ['remind_'];

function ownsCustomId(customId) {
    return typeof customId === 'string' && OWNED_PREFIXES.some(prefix => customId.startsWith(prefix));
}

async function loadState(userId) {
    const ReminderSubscription = require('../models/ReminderSubscription');
    const SeasonalData = require('../models/SeasonalData');
    const [sub, doc] = await Promise.all([ReminderSubscription.findOne({ discordId: userId }).lean(), SeasonalData.findOne({ docType: 'global' }).lean()]);
    return { sub, doc };
}

// The reader's chosen zone, for the dropdowns' written-out times (utils/reminders.js optionTime); null (shown as UTC) unless they picked one, since `timezone` alone stores its Toronto default on every new record (models/UserPreference.js timezoneSetAt).
async function userZone(userId) {
    const UserPreference = require('../models/UserPreference');
    const prefs = await UserPreference.findOne({ discordId: userId }, { timezone: 1, timezoneSetAt: 1 }).lean();
    return prefs?.timezoneSetAt && prefs.timezone ? prefs.timezone : null;
}

// Saves a picked zone the way /settings does, with the time it was chosen.
async function saveZone(userId, tz) {
    const UserPreference = require('../models/UserPreference');
    await UserPreference.findOneAndUpdate({ discordId: userId }, { $set: { timezone: tz, timezoneSetAt: new Date() } }, { upsert: true, setDefaultsOnInsert: true });
}

// The Set timezone picker's one-click zones: /settings' own shortlist (utils/timezoneData.js).
function quickZones() {
    return require('../utils/timezoneData').quickZoneOptions(); // west to east by offset
}

// Set timezone opens one box with both ways in (Harkirat, 2026-10-24 21:12 EDT: "Just do a modal when the button is pressed? That holds 2 fields: a search and a quick pick dropdown menu"): /settings' shortlist as a dropdown, the chosen zone pre-selected, and a search field for anything else. Typed text wins over the dropdown, since the dropdown arrives with the current zone already picked.
// `idPrefix` is remind_tzsearchdm when the box was opened from the timezone tip DM, whose submit confirms in place instead of drawing the panel.
function zoneModal(owner, current, idPrefix = 'remind_tzsearch') {
    return {
        title: 'Set your timezone', custom_id: `${idPrefix}:${owner}`,
        components: [
            { type: 18, label: 'Quick pick', description: 'Common timezones', component: { type: 3, custom_id: 'zone', required: false, placeholder: 'Pick your timezone…', options: quickZones().slice(0, 25).map(o => ({ ...o, default: o.value === current })) } },
            { type: 18, label: 'Or search', description: 'A city, country or abbreviation', component: { type: 4, custom_id: 'query', style: 1, required: false, max_length: 60, placeholder: 'Toronto, London, Tokyo, PST…' } },
        ],
    };
}

function accent() {
    try { return require('../commands/calendar').PRESET_ACCENT; } catch { return undefined; }
}

// Writes the record, creating it on first use; a record left with nothing followed is deleted, so Stop all and turning the last thing off leave no data behind (PRIVACY.md).
async function saveSub(userId, update) {
    const ReminderSubscription = require('../models/ReminderSubscription');
    const sub = await ReminderSubscription.findOneAndUpdate({ discordId: userId }, update, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }).lean();
    if (!sub.categories?.length && !sub.follows?.length && !sub.pausedAt) {
        await ReminderSubscription.deleteOne({ _id: sub._id });
        return null;
    }
    return await R.clearTurnedOff(sub);
}

// The panel, privately, as a new message: the bell, the DM's button, and the confirm's "Open reminders".
async function openOwnPanel(interaction) {
    await interaction.deferReply({ flags: 64 });
    const [{ sub, doc }, timeZone] = await Promise.all([loadState(interaction.user.id), userZone(interaction.user.id)]);
    return await sendV2Payload(interaction, R.buildPanel(sub, doc || {}, { ownerId: interaction.user.id, accentColor: accent(), timeZone }));
}

// Re-renders the panel the click came from.
async function rerender(interaction, sub, { confirmStop = false } = {}) {
    const SeasonalData = require('../models/SeasonalData');
    const [doc, timeZone] = await Promise.all([SeasonalData.findOne({ docType: 'global' }).lean(), userZone(interaction.user.id)]);
    return await sendV2Payload(interaction, R.buildPanel(sub, doc || {}, { ownerId: interaction.user.id, accentColor: accent(), confirmStop, timeZone }));
}

// A timezone search with several matches answers privately with this dropdown, from the panel and from the timezone tip DM alike (Harkirat, 2026-10-25 01:19 EDT: "why not just a new ephemeral message?" … "yes").
function zoneChoices(owner, found) {
    return { content: `${emojis.timezone} Which one do you mean?`, components: [{ type: 1, components: [{ type: 3, custom_id: `remind_tzsetdm:${owner}`, placeholder: 'Pick your timezone…', options: found.slice(0, 25).map(o => ({ label: String(o.label).slice(0, 100), value: o.value, ...(o.description ? { description: String(o.description).slice(0, 100) } : {}) })) }] }], flags: 64 };
}
// The panel a several-matches search came from, so the pick can refresh it: the search's own interaction may edit that message for 15 minutes.
const panelsAwaitingZone = new Map();

async function notYours(interaction) {
    try {
        await interaction.reply({ content: `${emojis.remind} This is someone else's reminders panel.`, components: [{ type: 1, components: [{ type: 2, style: 2, label: 'Open your own reminders', custom_id: 'remind_open', emoji: emojis.parseEmoji(emojis.remind) }] }], flags: 64 });
    } catch (error) {
        console.error('Failed to answer a click on someone else\'s reminders panel:', error?.message);
    }
}

async function route(interaction) {
    const id = interaction.customId;

    if (interaction.isButton() && interaction.customId === 'remind_open') return await openOwnPanel(interaction);

    const [, a, b] = id.split(':');
    const owner = b ?? a;
    if (owner !== interaction.user.id) return await notYours(interaction);

    if (interaction.isButton() && interaction.customId.startsWith('remind_cat:')) {
        await interaction.deferUpdate();
        const ReminderSubscription = require('../models/ReminderSubscription');
        const current = await ReminderSubscription.findOne({ discordId: owner }).lean();
        // A leaving kind is toggled against the four explicit keys, so the older all-kinds `leaving` key (or an old panel's Leaving soon button, which turns all four on or off) never hides a change (Harkirat, 2026-10-25 00:32 EDT: "let's actually go option A from earlier but maybe better organize/structure so things are more intuitive", after the option C dropdown read as confusing).
        const kindKeys = R.CATEGORIES.filter(c => c.group === 'leaving').map(c => c.key);
        if (a === 'leaving' || kindKeys.includes(a)) {
            const cats = new Set(current?.categories || []);
            const on = R.leavingKeys(cats);
            if (a === 'leaving') { if (on.size) on.clear(); else kindKeys.forEach(k => on.add(k)); } else if (on.has(a)) on.delete(a); else on.add(a);
            const categories = [...[...cats].filter(k => k !== 'leaving' && !kindKeys.includes(k)), ...on];
            return await rerender(interaction, await saveSub(owner, { $set: { categories } }));
        }
        const on = (current?.categories || []).includes(a);
        const sub = await saveSub(owner, on ? { $pull: { categories: a } } : { $addToSet: { categories: a } });
        return await rerender(interaction, sub);
    }

    // Leaving soon by kind (Harkirat, 2026-10-25 00:23 EDT: "let's go option C", after asking how someone would hear only when new draws, or all draws, are leaving): each picked kind toggles; the older all-kinds key is rewritten as the four kinds first.
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('remind_lvkinds:')) {
        await interaction.deferUpdate();
        const ReminderSubscription = require('../models/ReminderSubscription');
        const current = await ReminderSubscription.findOne({ discordId: owner }).lean();
        const cats = new Set(current?.categories || []);
        const on = R.leavingKeys(cats);
        for (const v of interaction.values) on.has(v) ? on.delete(v) : on.add(v);
        const kindKeys = new Set(R.CATEGORIES.filter(c => c.group === 'leaving').map(c => c.key));
        const categories = [...[...cats].filter(k => k !== 'leaving' && !kindKeys.has(k)), ...on];
        const sub = await saveSub(owner, { $set: { categories } });
        return await rerender(interaction, sub);
    }

    if (interaction.isStringSelectMenu() && (interaction.customId.startsWith('remind_rel:') || interaction.customId.startsWith('remind_lv:'))) {
        await interaction.deferUpdate();
        const kind = interaction.customId.startsWith('remind_rel:') ? 'release' : 'leaving';
        const { sub: current, doc } = await loadState(owner);
        const { releases, leaving } = R.followable(doc || {});
        const shown = (kind === 'release' ? releases : leaving).slice(0, R.MAX_OPTIONS);
        const listed = shown.map(e => e.title);
        // A pick a group toggle already covers changes nothing (its row says "Already on through …").
        const cats = new Set(current?.categories || []);
        const picked = interaction.values.filter(v => { const e = shown.find(x => x.title.slice(0, 100) === v); return !(e && R.coveringCategory(cats, kind, e)); });
        const follows = R.mergeFollows(current?.follows || [], kind, listed, picked);
        const sub = await saveSub(owner, { $set: { follows } });
        return await rerender(interaction, sub);
    }

    if (interaction.isButton() && interaction.customId.startsWith('remind_search:')) {
        return await interaction.showModal({
            title: 'Find a draw, event or playlist', custom_id: `remind_searchsub:${owner}`,
            components: [{ type: 1, components: [{ type: 4, custom_id: 'q', label: 'Its name', style: 1, required: true, max_length: 100, placeholder: 'Black Hole Draw' }] }],
        });
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('remind_searchsub:')) {
        const SeasonalData = require('../models/SeasonalData');
        const doc = await SeasonalData.findOne({ docType: 'global' }).lean();
        const found = R.resolveSetValue(interaction.fields.getTextInputValue('q'), doc || {});
        if (!found) {
            try {
                await interaction.reply({ content: `${emojis.cross} Nothing this season matches that name. It has to be a draw, event or playlist that hasn't released yet, or one that's live with an end date.`, flags: 64 });
            } catch (error) {
                console.error('Failed to answer a reminders search:', error?.message);
            }
            return;
        }
        await interaction.deferUpdate();
        const ReminderSubscription = require('../models/ReminderSubscription');
        const current = await ReminderSubscription.findOne({ discordId: owner }).lean();
        const follows = (current?.follows || []).filter(f => !(f.kind === found.kind && f.title === found.title));
        const sub = await saveSub(owner, { $set: { follows: [...follows, { kind: found.kind, title: found.title }] } });
        return await rerender(interaction, sub);
    }

    // Send a test: one DM now, so a person can check their reminders will reach them, and with reminders on it is their real next reminder (utils/reminders.js buildTestDM, his ask of 2026-10-24 19:39 EDT); a refusal names both fixes (DMs off, or the app removed, give the same error).
    if (interaction.isButton() && interaction.customId.startsWith('remind_test:')) {
        await interaction.deferReply({ flags: 64 });
        const { Routes } = require('discord.js');
        try {
            const { sub, doc } = await loadState(owner);
            const components = R.buildTestDM(sub, doc || {}, { accentColor: accent() });
            const dm = await interaction.client.users.createDM(owner);
            await interaction.client.rest.post(Routes.channelMessages(dm.id), { body: { flags: 32768, allowed_mentions: { parse: [] }, components } });
            return await interaction.editReply({ content: `${emojis.checkmark} Sent. Check your DMs from Dioreo.` });
        } catch (err) {
            if (!R.isRefusal(err)) throw err;
            return await interaction.editReply({ content: `${emojis.cross} Discord wouldn't let Dioreo DM you. Turn on DMs from a server you share with Dioreo, or add Dioreo to your account, then try again.` });
        }
    }

    // Set timezone: the box with the shortlist and a search field (zoneModal). It must be the first response, so no defer.
    if (interaction.isButton() && interaction.customId.startsWith('remind_tz:')) {
        return await interaction.showModal(zoneModal(owner, await userZone(owner)));
    }

    // The timezone tip DM: the same box, its submit (remind_tzsearchdm) confirming in place (Harkirat, 2026-10-24 23:44 EDT ask: "for the first time… when a real reminder sends… send another follow-up DM… heads up… your time zone… with the set button in it").
    if (interaction.isButton() && interaction.customId.startsWith('remind_tzdm:')) {
        return await interaction.showModal(zoneModal(owner, await userZone(owner), 'remind_tzsearchdm'));
    }
    if (interaction.isModalSubmit() && interaction.customId.startsWith('remind_tzsearchdm:')) {
        const { searchTimezones, timezoneBaseLabel } = require('../utils/timezoneData');
        let query = '';
        try { query = (interaction.fields.getTextInputValue('query') || '').trim(); } catch { query = ''; }
        let pick = null;
        try { pick = interaction.fields.getStringSelectValues('zone')[0] || null; } catch { pick = null; }
        const found = query ? searchTimezones(query, 24) : [];
        const tz = query ? (found.length === 1 ? found[0].value : null) : pick;
        if (tz) {
            await interaction.deferUpdate();
            await saveZone(owner, tz);
            return await sendV2Payload(interaction, R.buildTimezoneNote(owner, { accentColor: accent(), setTo: timezoneBaseLabel(tz), client: interaction.client }));
        }
        try {
            if (!found.length) await interaction.reply({ content: `${emojis.cross} ${query ? 'No timezone matches that. Try a city, a country or an abbreviation like PST.' : 'Pick a timezone from the list, or type one to search.'}`, flags: 64 });
            else await interaction.reply(zoneChoices(owner, found));
        } catch (error) {
            console.error('Failed to answer a timezone tip search:', error?.message);
        }
        return;
    }
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('remind_tzsetdm:')) {
        const { timezoneBaseLabel } = require('../utils/timezoneData');
        await interaction.deferUpdate();
        await saveZone(owner, interaction.values[0]);
        await interaction.editReply({ content: `${emojis.checkmark} Timezone set to **${timezoneBaseLabel(interaction.values[0])}**. /remind's lists now show your time.`, components: [] });
        const panel = panelsAwaitingZone.get(owner);
        panelsAwaitingZone.delete(owner);
        if (panel && Date.now() - panel.at < 14 * 60 * 1000) {
            try { const { sub } = await loadState(owner); await rerender(panel.interaction, sub); } catch (error) { console.error('Failed to refresh the reminders panel after a timezone pick:', error?.message); }
        }
        return;
    }

    // The box submitted: typed text is searched (one match saved at once, several answered privately with a dropdown of just those); otherwise the dropdown's pick is saved.
    if (interaction.isModalSubmit() && interaction.customId.startsWith('remind_tzsearch:')) {
        const { searchTimezones } = require('../utils/timezoneData');
        let query = '';
        try { query = (interaction.fields.getTextInputValue('query') || '').trim(); } catch { query = ''; }
        let pick = null;
        try { pick = interaction.fields.getStringSelectValues('zone')[0] || null; } catch { pick = null; }
        if (!query && pick) {
            await interaction.deferUpdate();
            await saveZone(owner, pick);
            const { sub } = await loadState(owner);
            return await rerender(interaction, sub);
        }
        const found = query ? searchTimezones(query, 24) : [];
        if (!found.length) {
            try {
                await interaction.reply({ content: `${emojis.cross} ${query ? 'No timezone matches that. Try a city, a country or an abbreviation like PST.' : 'Pick a timezone from the list, or type one to search.'}`, flags: 64 });
            } catch (error) {
                console.error('Failed to answer a reminders timezone search:', error?.message);
            }
            return;
        }
        await interaction.deferUpdate();
        if (found.length > 1) {
            // Several matches: a private "Which one do you mean?" dropdown; the panel stays as it is until a pick refreshes it.
            panelsAwaitingZone.set(owner, { interaction, at: Date.now() });
            try { await interaction.followUp(zoneChoices(owner, found)); } catch (error) { console.error('Failed to send the timezone choices:', error?.message); }
            return;
        }
        await saveZone(owner, found[0].value);
        const { sub } = await loadState(owner);
        return await rerender(interaction, sub);
    }

    if (interaction.isButton() && (interaction.customId.startsWith('remind_stop:') || interaction.customId.startsWith('remind_stopno:'))) {
        await interaction.deferUpdate();
        const { sub } = await loadState(owner);
        return await rerender(interaction, sub, { confirmStop: interaction.customId.startsWith('remind_stop:') });
    }

    if (interaction.isButton() && interaction.customId.startsWith('remind_stopyes:')) {
        await interaction.deferUpdate();
        const ReminderSubscription = require('../models/ReminderSubscription');
        await ReminderSubscription.deleteOne({ discordId: owner });
        R.pendingNotice.delete(owner);
        return await rerender(interaction, null);
    }

    if (interaction.isButton() && interaction.customId.startsWith('remind_resume:')) {
        const ReminderSubscription = require('../models/ReminderSubscription');
        const sub = await ReminderSubscription.findOneAndUpdate({ discordId: owner }, { $set: { pausedAt: null, pauseNoteShown: false, failingSince: null, noteDue: false, noteShownAt: null } }, { returnDocument: 'after' }).lean();
        R.pendingNotice.delete(owner);
        // From the panel it redraws the panel; from the note on a command it answers privately.
        if (interaction.message?.flags?.has?.(32768)) {
            await interaction.deferUpdate();
            return await rerender(interaction, sub);
        }
        try {
            await interaction.reply({ content: `${emojis.reminderEnabled} Reminders are back on. The next one comes at the daily update.`, flags: 64 });
        } catch (error) {
            console.error('Failed to confirm reminders resumed:', error?.message);
        }
    }
}

// Returns TRUE when this subsystem owns the interaction (and has now handled it), FALSE otherwise -- the contract every handlers/*.js module follows.
async function handleRemindInteraction(interaction) {
    if (!ownsCustomId(interaction.customId)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleRemindInteraction, OWNED_PREFIXES };
