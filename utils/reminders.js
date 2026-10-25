// ==========================================
// REMINDERS -- /remind, the bell, and the daily DM
// ==========================================
// The design Harkirat agreed over four rounds on 2026-10-23 19:47–21:11 EDT: docs/superpowers/specs/2026-10-23-notifications-design.md. A person follows whole categories (every new draw, the daily digest, BP ending...) or one thing (this draw's release, this event leaving), and once a day at 00:01 UTC, a minute after the game's daily update, Dioreo sends them ONE DM with everything that fired for them that day.
//
// ⚠️ THE THIRD PROACTIVE MESSAGE THE BOT SENDS (CLAUDE.md's "answers only through interactions" invariant names it): a DM to a user who opted in, carrying only what they asked for. Never a channel, never anyone who did not ask.
//
// WHO A DM CAN REACH, tested on his alt 2026-10-23 20:35–20:55 EDT: anyone who added the app to their account, and anyone sharing a server with the bot who allows DMs from that server's members. A refused send is `403 50278` whether DMs are off or the app was removed, so the failure note names both fixes; opening the DM channel succeeds even then, so only the send's result tells.
//
// Pure functions first (what is due, what one person gets, the panel), so scripts/reminders.test.js can check them with no Discord and no database; the runner and the note hook last.

const emojis = require('./emojiMap');
const { isSameDrawTitle } = require('./search');

const DAY_MS = 86400000;
// The categories, in the panel's order. `emoji` is an emojiMap key, read at render time (scripts/checkEmojiCaptures.js).
const CATEGORIES = [
    { key: 'newDraws', label: 'New draws', short: 'New draws', group: 'releases', emoji: 'newDraws', hint: 'every new draw, when it releases' },
    { key: 'returningDraws', label: 'Returning draws', short: 'Returning draws', group: 'releases', emoji: 'returningDraws', hint: 'every returning draw, when it releases' },
    { key: 'events', label: 'Events', short: 'Events', group: 'releases', emoji: 'events', hint: 'every event, when it starts' },
    { key: 'playlists', label: 'Playlists & modes', short: 'Playlists & modes', group: 'releases', emoji: 'modes', hint: 'every playlist and mode, when it starts' },
    { key: 'leaving', label: 'Leaving soon', short: 'Leaving soon', group: 'releases', emoji: 'yellowDotGlow', hint: 'everything, 2 days and 1 day before it leaves' },
    { key: 'newSeason', label: 'New season', short: 'New season', group: 'season', emoji: 'greenDotGlow', hint: 'the day a new season starts' },
    { key: 'patchNotes', label: 'Patch notes', short: 'Patch notes', group: 'updates', emoji: 'patchNotes', hint: 'when new patch notes are posted' },
    { key: 'digest', label: 'Daily digest', short: 'Daily /today', group: 'updates', emoji: 'calendar', hint: 'the whole /today brief' },
    { key: 'bpEnding', label: 'BP ending', short: 'Battle Pass ends', group: 'season', emoji: 'bp1', hint: '3 days before the Battle Pass ends, and its last day' },
    { key: 'rankEnding', label: 'Ranked ending', short: 'Ranked ends', group: 'season', emoji: 'rank', hint: '3 days before Ranked ends, and its last day' },
    { key: 'dmzEnding', label: 'DMZ ending', short: 'DMZ ends', group: 'season', emoji: 'dmz', hint: '3 days before the DMZ season ends, and its last day' },
];
// The panel's three groups (his ask 2026-10-23 21:58 EDT, "improve the design and layout/structure"), each a small label over one row of toggles. Regrouped 2026-10-24 18:58 EDT (Harkirat: "Better organize this section? The heads up section kind of feels mixed together"): what goes live or leaves sits together, everything about the season sits together, and the two news DMs close the list.
const PANEL_GROUPS = [['releases', 'Draws, events & modes', 'when one goes live, or before it leaves'], ['season', 'Season', 'when one starts, and 3 days before each part ends'], ['updates', 'Updates', 'new patch notes, or the whole /today brief each day']];
const CATEGORY_KEYS = new Set(CATEGORIES.map(c => c.key));
// Which category covers an entry's release, by /today's own entry kinds (commands/today.js collectEntries).
const releaseCategory = e => (e.type === 'event' ? 'events' : e.type === 'playlist' ? 'playlists' : e.kind === 'Returning draw' ? 'returningDraws' : 'newDraws');
const SEASON_ENDS = [['bpEnding', 'bpEnd', 'bpTitle', 'Battle Pass', 'bp1'], ['rankEnding', 'rankEnd', 'rankTitle', 'Ranked Series', 'rank'], ['dmzEnding', 'dmzEnd', 'dmzTitle', 'DMZ Season', 'dmz']];

const dayKey = ms => new Date(ms).toISOString().slice(0, 10);
const rel = ms => `<t:${Math.floor(ms / 1000)}:R>`;
const sameTitle = (a, b) => a === b || isSameDrawTitle(a, b);

// Everything that fires on the game day around `nowMs`, for everyone; personalise() then picks each person's share. The run is at 00:01 UTC, so "time left" windows give his two leaving-soon reminders: 47h59m left ("Heads up, leaving soon") and 23h59m left ("Heads up, last chance"), his round-2 answer at 20:35 EDT. Entries end at 00:00 UTC, so both fall on the run.
function computeDue(seasonalDoc, nowMs = Date.now()) {
    const { collectEntries, gameDay } = require('../commands/today');
    const { start, next } = gameDay(nowMs);
    const entries = collectEntries(seasonalDoc, nowMs);
    const left = e => e.endMs - nowMs;
    const released = entries.filter(e => Number.isFinite(e.startMs) && e.startMs >= start && e.startMs < next).map(e => ({ ...e, category: releaseCategory(e) }));
    const live = entries.filter(e => e.state === 'live' && Number.isFinite(e.endMs));
    const lastChance = live.filter(e => left(e) > 0 && left(e) <= DAY_MS).sort((a, b) => a.endMs - b.endMs);
    const leavingSoon = live.filter(e => left(e) > DAY_MS && left(e) <= 2 * DAY_MS).sort((a, b) => a.endMs - b.endMs);

    const bpStart = seasonalDoc.bpStart ? new Date(seasonalDoc.bpStart).getTime() : NaN;
    const newSeason = bpStart >= start && bpStart < next ? { title: seasonalDoc.currentSeasonTitle || 'A new season', emoji: seasonalDoc.currentSeasonEmoji || null } : null;

    // "3 days before, and on the last day" (his round-2 answer): at the 00:01 run, (2, 3] days left is the first, (0, 1] the last day.
    const seasonEnds = [];
    for (const [category, field, titleField, fallback, emojiKey] of SEASON_ENDS) {
        if (seasonalDoc[`${field}TBD`] || !seasonalDoc[field]) continue;
        const endMs = new Date(seasonalDoc[field]).getTime();
        const ms = endMs - nowMs;
        if (ms > 2 * DAY_MS && ms <= 3 * DAY_MS) seasonEnds.push({ category, title: seasonalDoc[titleField] || fallback, endMs, last: false, emojiKey });
        else if (ms > 0 && ms <= DAY_MS) seasonEnds.push({ category, title: seasonalDoc[titleField] || fallback, endMs, last: true, emojiKey });
    }

    // New patch notes: an entry created in the last day. A patch-note entry's _id is a fresh ObjectId when /manage adds it, so its creation time needs no field of its own.
    const patchNotes = (seasonalDoc.patchNotes || []).filter(p => {
        const t = p._id?.getTimestamp?.()?.getTime?.();
        return Number.isFinite(t) && t > nowMs - DAY_MS && t <= nowMs;
    }).map(p => p.titleOverride || p.title || 'New patch notes');

    return { day: dayKey(start), start, next, released, leavingSoon, lastChance, newSeason, seasonEnds, patchNotes };
}

// One person's share of what is due, or null when nothing applies. `fired` lists the one-thing follows used up today: a release follow once its thing released, a leaving follow once its last-chance reminder has gone.
function personalise(sub, due) {
    const cats = new Set(sub.categories || []);
    const follows = sub.follows || [];
    const followed = (kind, title) => follows.some(f => f.kind === kind && sameTitle(f.title, title));
    const released = due.released.filter(e => cats.has(e.category) || followed('release', e.title)).map(e => ({ ...e, followed: followed('release', e.title) }));
    const leavingPick = e => cats.has('leaving') || followed('leaving', e.title);
    const lastChance = due.lastChance.filter(leavingPick).map(e => ({ ...e, followed: followed('leaving', e.title) }));
    const leavingSoon = due.leavingSoon.filter(leavingPick).map(e => ({ ...e, followed: followed('leaving', e.title) }));
    const newSeason = cats.has('newSeason') ? due.newSeason : null;
    const seasonEnds = due.seasonEnds.filter(s => cats.has(s.category));
    const patchNotes = cats.has('patchNotes') ? due.patchNotes : [];
    const digest = cats.has('digest');
    const fired = follows.filter(f => (f.kind === 'release' && due.released.some(e => sameTitle(f.title, e.title)))
        || (f.kind === 'leaving' && due.lastChance.some(e => sameTitle(f.title, e.title))));
    const any = digest || released.length || lastChance.length || leavingSoon.length || newSeason || seasonEnds.length || patchNotes.length;
    return any ? { digest, released, lastChance, leavingSoon, newSeason, seasonEnds, patchNotes, fired } : null;
}

const block = content => ({ type: 10, content });
const CAP = 15;
const listLines = (items, line) => [...items.slice(0, CAP).map(line), ...(items.length > CAP ? [`-# +${items.length - CAP} more`] : [])];
// The mark after a title you follow (his ReminderEnabled icon, 2026-10-24 18:15 EDT); titles carry Remind, and a heads-up or a warning carries RemindAlert.
const bell = () => emojis.reminderEnabled;
const mark = e => (e.followed ? ` ${bell()}` : '');

// The parts of a reminder the /today brief does not carry: season starts and ends, and patch notes. Used under the digest and in the plain reminder alike.
function extraBlocks(p) {
    const out = [];
    if (p.newSeason) out.push(block(`### ${emojis.greenDotGlow} New season\n${p.newSeason.emoji ? `${p.newSeason.emoji} ` : ''}**${p.newSeason.title}** is live`));
    if (p.seasonEnds.length) out.push(block([`### ${emojis.yellowDotGlow} Season`, ...p.seasonEnds.map(s => `${emojis[s.emojiKey] || ''} **${s.title}** ${s.last ? 'ends' : 'ends in 3 days,'} ${rel(s.endMs)}`)].join('\n')));
    if (p.patchNotes.length) out.push(block([`### ${emojis.patchNotes} Patch notes`, ...p.patchNotes.map(t => `- **${t}** · see /patch notes`)].join('\n')));
    return out;
}

// The "Manage reminders" row every reminder DM ends with; the button opens the panel privately.
const manageRow = () => ({ type: 1, components: [{ type: 2, style: 2, label: 'Manage reminders', custom_id: 'remind_open', emoji: emojis.parseEmoji(emojis.remind) }] });

// The DM, as Components V2 JSON, or null. His order (round 3): Last chance · Leaving soon · Released · Season · Patch notes. With the digest on, the /today brief takes the place of Released and the leaving lists, with followed items marked by the bell (his round-2 Q4: the digest absorbs the rest), and the season and patch-note parts follow it.
function buildReminderDM(p, seasonalDoc, { nowMs = Date.now(), accentColor = 4093660 } = {}) {
    if (!p) return null;
    // The run's own time, as a Discord timestamp, so each reader sees it in their zone (Harkirat, 2026-10-24 19:56 EDT: "improve the way the date is displayed on the brief"). It was a UTC date string, which read "Saturday, October 24" in Toronto for an update that landed Friday at 8:01 PM there.
    const dateLine = `-# ${emojis.dailyUpdate} Daily update · <t:${Math.floor(nowMs / 1000)}:f>`;
    const sep = { type: 14, divider: true, spacing: 2 };
    let body;
    if (p.digest) {
        // The brief exactly as /today draws it, each new draw as its own block with its items and thumbnail (Harkirat, 2026-10-24 19:48 EDT: "shouldn't the black hole draw item be fully detailed including the thumbnail?"). It used to be the 'compact' plain lines; now /today's own fitMessage steps down to compact, then capped, only when the whole DM would pass Discord's 40 components or 4,000 characters.
        const { fitMessage } = require('../commands/today');
        const marked = [...p.released, ...p.lastChance, ...p.leavingSoon].filter(e => e.followed).map(e => e.title);
        const extra = extraBlocks(p);
        const wrap = brief => [{ type: 17, accent_color: accentColor, components: [
            block(`## ${emojis.remind} Your daily brief\n${dateLine}`), sep, ...brief.map(c => markFollowed(c, marked)),
            ...(extra.length ? [sep, ...extra] : []), { type: 14, divider: false, spacing: 1 }, manageRow(),
        ] }];
        return fitMessage(seasonalDoc, { nowMs }, wrap);
    } else {
        const parts = [];
        const line = e => `- ${e.icon} **${e.title}**${mark(e)}`;
        if (p.lastChance.length) parts.push(block([`### ${emojis.remindAlert} Heads up, last chance`, ...listLines(p.lastChance, e => `${line(e)} · ends ${rel(e.endMs)}`)].join('\n')));
        if (p.leavingSoon.length) parts.push(block([`### ${emojis.remindAlert} Heads up, leaving soon`, ...listLines(p.leavingSoon, e => `${line(e)} · ends ${rel(e.endMs)}`)].join('\n')));
        if (p.released.length) parts.push(block([`### ${emojis.greenDotGlow} Released`, ...listLines(p.released, line)].join('\n')));
        parts.push(...extraBlocks(p));
        body = [block(`## ${emojis.remind} Your reminders\n${dateLine}`), sep, ...parts];
    }
    return [{ type: 17, accent_color: accentColor, components: [...body, { type: 14, divider: false, spacing: 1 }, manageRow()] }];
}

// What Send a test DMs (Harkirat, 2026-10-24 19:39 EDT: "When someone has reminders enabled and they tap send a test, can you make it actually their reminders?"). With reminders on, it is the real DM from TODAY's daily update (the last run), built exactly as the run builds it, under a one-line note that it is a test; when nothing they follow happened then, it says so and lists what they follow. With nothing on, the plain test card. ⚠️ It shows the LAST run, not the next one: Discord draws every <t:…:R> against the reader's clock, so a DM built for a run still to come read "Released in 14 minutes" and gave the next daily update a day too late (his screenshot, 19:47 EDT: "Timings for the daily update doesn't make sense?").
function buildTestDM(sub, seasonalDoc, { nowMs = Date.now(), accentColor = 4093660 } = {}) {
    const runMs = nowMs + msUntilNextRun(nowMs) - DAY_MS; // today's daily update, already past
    const note = text => ({ type: 10, content: `-# ${emojis.remind} ${text}` });
    const on = sub && (sub.categories?.length || sub.follows?.length);
    if (!on) return [{ type: 17, accent_color: accentColor, components: [block(`### ${emojis.remind} Test reminder\n-# Your reminders will arrive here, one DM a day at the daily update.`)] }];
    const p = personalise(sub, computeDue(seasonalDoc, runMs));
    const dm = p ? buildReminderDM(p, seasonalDoc, { nowMs: runMs, accentColor }) : null;
    if (dm) return [note(`A test: this is your reminder from today's daily update, ${rel(runMs)}.`), ...dm];
    const following = [...CATEGORIES.filter(c => sub.categories?.includes(c.key)).map(c => c.label), ...(sub.follows || []).map(f => `${f.title} (${f.kind === 'release' ? 'when it releases' : 'before it leaves'})`)];
    return [note('A test.'), { type: 17, accent_color: accentColor, components: [
        block(`### ${emojis.remind} Nothing at today's daily update\n-# Nothing you follow happened at the daily update ${rel(runMs)}, so no reminder came. Your reminders arrive here when something does.`),
        block(['-# **You follow**', ...following.slice(0, 15).map(f => `- ${f}`), ...(following.length > 15 ? [`-# +${following.length - 15} more`] : [])].join('\n')),
        { type: 14, divider: false, spacing: 1 }, manageRow(),
    ] }];
}

// Adds the bell after each followed title in a text component of the /today brief, once per title.
function markFollowed(component, titles) {
    if (!titles.length) return component;
    const patch = c => {
        if (c.type === 10 && typeof c.content === 'string') {
            let s = c.content;
            for (const t of titles) s = s.replace(t, `${t} ${bell()}`);
            return { ...c, content: s };
        }
        return c.components ? { ...c, components: c.components.map(patch) } : c;
    };
    return patch(component);
}

// ---------- The panel ----------

// The entries a one-thing follow can pick from: what has not released yet (soonest first), and what is live with an end date (leaving first).
function followable(seasonalDoc, nowMs = Date.now()) {
    const { collectEntries } = require('../commands/today');
    const entries = collectEntries(seasonalDoc, nowMs);
    const releases = entries.filter(e => e.state === 'soon').sort((a, b) => a.startMs - b.startMs || a.title.localeCompare(b.title));
    const leaving = entries.filter(e => e.state === 'live' && Number.isFinite(e.endMs)).sort((a, b) => a.endMs - b.endMs || a.title.localeCompare(b.title));
    return { releases, leaving };
}

const MAX_OPTIONS = 25; // Discord's select-menu cap
// A dropdown option's time, in the reader's own /settings zone with its abbreviation: "Oct 27, 8 PM EDT". Discord draws <t:…> codes only in message text, never in a select's option text, so the real time has to be written out (Harkirat, 2026-10-24 20:13 EDT: "For these times in the dropdown, what are they set to? Can you put real timestamps in there?"). They were bare UTC dates, which put an 8 PM Toronto release on the next day.
function optionTime(ms, timeZone) {
    const fmt = tz => new Date(ms).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone: tz }).replace(':00', '').replace(/\s+/g, ' ');
    try { return fmt(timeZone || 'UTC'); } catch { return fmt('UTC'); }
}
const optionValue = title => title.slice(0, 100);
const parseEmoji = s => { try { return emojis.parseEmoji(s); } catch { return undefined; } };

// The /remind panel, as one Components V2 container, laid out like /settings (his round-3 Q3), then redesigned on his ask of 2026-10-23 21:58 EDT ("improve the design and layout/structure"):
//   a header Section saying what is on and when the next DM comes, with a Send a test button beside it (so a person can check their DMs reach them before relying on it);
//   three labelled groups of toggles, Releases · Heads up · Season ending, green when on;
//   "Or pick only what you want": what is followed, each with its date, then the two dropdowns;
//   Search (past 25) and Stop all at the foot.
// The panel is where the state shows (the bell never does). Every custom id carries the owner, so a public panel is locked to them (his round-4 Q1). 31 components at most, under Discord's 40.
function buildPanel(sub, seasonalDoc, { ownerId, nowMs = Date.now(), accentColor = 4093660, confirmStop = false, timeZone = 'UTC' } = {}) {
    const cats = new Set(sub?.categories || []);
    const follows = sub?.follows || [];
    const { releases, leaving } = followable(seasonalDoc, nowMs);
    const nextRun = nowMs + msUntilNextRun(nowMs);

    const summary = [];
    if (cats.size) summary.push(`${cats.size} ${cats.size === 1 ? 'group' : 'groups'}`);
    if (follows.length) summary.push(`${follows.length} picked`);
    const status = summary.length
        ? `**On:** ${summary.join(' · ')}\n-# Your next DM comes ${rel(nextRun)}, if anything you follow happens that day.`
        : '-# Nothing on yet. Turn on a group below, or pick only the draws, events or playlists you want.';
    const header = { type: 9, components: [block(`## ${emojis.remind} Reminders\n-# One DM a day, a minute after the daily update, with only what you pick.\n${status}`)],
        accessory: { type: 2, style: 2, label: 'Send a test', custom_id: `remind_test:${ownerId}` } };
    const warning = sub?.pausedAt
        ? `${emojis.remindAlert} **Paused:** your reminders couldn't reach you. Turn on DMs from a server you share with Dioreo, or add Dioreo to your account, then press **Turn back on**.`
        : sub?.failingSince ? `${emojis.remindAlert} Your last reminder couldn't reach you. Turn on DMs from a server you share with Dioreo, or add Dioreo to your account.` : null;

    const groups = [];
    for (const [key, title, hint] of PANEL_GROUPS) {
        groups.push(block(`-# **${title}** · ${hint}`));
        groups.push({ type: 1, components: CATEGORIES.filter(c => c.group === key).map(c => ({ type: 2, style: cats.has(c.key) ? 3 : 2, label: c.short, custom_id: `remind_cat:${c.key}:${ownerId}`, emoji: parseEmoji(emojis[c.emoji]) })) });
    }

    const when = f => {
        const list = f.kind === 'release' ? releases : leaving;
        const e = list.find(x => sameTitle(x.title, f.title));
        if (!e) return f.kind === 'release' ? 'when it releases' : 'when it is leaving';
        return f.kind === 'release' ? `releases <t:${Math.floor(e.startMs / 1000)}:D>` : `leaving <t:${Math.floor(e.endMs / 1000)}:D>`;
    };
    const followLines = follows.length
        ? follows.map(f => `- ${bell()} **${f.title}** · ${when(f)}`)
        : ['-# Pick any draws, events or playlists below to hear about just those.'];

    const select = (kind, list, placeholder, describe) => {
        const shown = list.slice(0, MAX_OPTIONS);
        if (!shown.length) return null;
        return { type: 1, components: [{
            type: 3, custom_id: `remind_${kind === 'release' ? 'rel' : 'lv'}:${ownerId}`, placeholder, min_values: 0, max_values: shown.length,
            options: shown.map(e => ({ label: e.title.slice(0, 100), value: optionValue(e.title), description: describe(e), emoji: parseEmoji(e.icon), default: follows.some(f => f.kind === kind && sameTitle(f.title, e.title)) })),
        }] };
    };
    const relRow = select('release', releases, `Remind me when this releases… (${Math.min(releases.length, MAX_OPTIONS)} upcoming)`, e => `${e.kind} · releases ${optionTime(e.startMs, timeZone)}`);
    const lvRow = select('leaving', leaving, `Remind me before this leaves… (${Math.min(leaving.length, MAX_OPTIONS)} live)`, e => `${e.kind} · ends ${optionTime(e.endMs, timeZone)}`);

    const foot = [];
    if (sub?.pausedAt) foot.push({ type: 2, style: 3, label: 'Turn back on', custom_id: `remind_resume:${ownerId}`, emoji: parseEmoji(emojis.reminderEnabled) });
    if (releases.length > MAX_OPTIONS || leaving.length > MAX_OPTIONS) foot.push({ type: 2, style: 2, label: 'Search', custom_id: `remind_search:${ownerId}`, emoji: { name: '🔍' } });
    if (confirmStop) foot.push({ type: 2, style: 4, label: 'Yes, stop all and delete', custom_id: `remind_stopyes:${ownerId}`, emoji: parseEmoji(emojis.disableReminder) }, { type: 2, style: 2, label: 'Keep them', custom_id: `remind_stopno:${ownerId}` });
    else if (sub && (cats.size || follows.length)) foot.push({ type: 2, style: 4, label: 'Stop all', custom_id: `remind_stop:${ownerId}`, emoji: parseEmoji(emojis.disableReminder) });

    return [{ type: 17, accent_color: accentColor, components: [
        header,
        ...(warning ? [block(warning)] : []),
        { type: 14, divider: true, spacing: 2 },
        ...groups,
        // An alternative to the groups, not a second step (Harkirat, 2026-10-24 19:09 EDT: "it feels like it needs to be chosen in addition to the above toggle... better phrase it so it's clear that these are an 'or' option"), and never "one" (19:31 EDT: "they can pick a few options... 'or pick only what you want'"). His pick at 19:35 EDT was option B, an "— or —" line between the halves, with no drawn divider above it. A small gap each side and a capital OR (19:36 EDT: "Too much gap above the —or— ... Or make the or capital?").
        { type: 14, divider: false, spacing: 1 },
        block('-# **— OR —**'),
        { type: 14, divider: false, spacing: 1 },
        block(['-# **Pick only what you want** · specific draws, events or playlists, instead of a whole group', ...followLines].join('\n')),
        ...(relRow ? [relRow] : []),
        ...(lvRow ? [lvRow] : []),
        ...(foot.length ? [{ type: 14, divider: false, spacing: 1 }, { type: 1, components: foot }] : []),
    ] }];
}

// ---------- Changing a record ----------

// A one-thing follow's set for one kind after a dropdown submit: what was picked, plus any follow of that kind the dropdown did not list (past its 25, or no longer followable), so a submit never drops what it could not show.
function mergeFollows(follows, kind, listedTitles, picked) {
    const listed = new Set(listedTitles.map(optionValue));
    const kept = (follows || []).filter(f => f.kind !== kind || !listed.has(optionValue(f.title)));
    const titleFor = v => listedTitles.find(t => optionValue(t) === v) || v;
    return [...kept, ...picked.map(v => ({ kind, title: titleFor(v) }))];
}

// /remind's `set:` values: "cat:<key>", "rel:<title>" or "lv:<title>". Free text (typed without picking a suggestion) is read as a release follow when it names something not out yet, else a leaving follow when it names something live.
function resolveSetValue(value, seasonalDoc, nowMs = Date.now()) {
    if (typeof value !== 'string' || !value) return null;
    if (value.startsWith('cat:') && CATEGORY_KEYS.has(value.slice(4))) return { type: 'category', key: value.slice(4), label: CATEGORIES.find(c => c.key === value.slice(4)).label };
    const { releases, leaving } = followable(seasonalDoc, nowMs);
    const find = (list, t) => list.find(e => e.title === t) || list.find(e => sameTitle(e.title, t)) || list.find(e => e.title.toLowerCase().includes(t.toLowerCase()));
    if (value.startsWith('rel:')) { const e = find(releases, value.slice(4)); return e ? { type: 'follow', kind: 'release', title: e.title } : null; }
    if (value.startsWith('lv:')) { const e = find(leaving, value.slice(3)); return e ? { type: 'follow', kind: 'leaving', title: e.title } : null; }
    const r = find(releases, value);
    if (r) return { type: 'follow', kind: 'release', title: r.title };
    const l = find(leaving, value);
    return l ? { type: 'follow', kind: 'leaving', title: l.title } : null;
}

// /remind's autocomplete: the categories pinned first (his round-2 answer: "fuzzy search with the main options sticky"), then this season's entries, each twice, matched against what was typed.
function autocompleteChoices(focused, seasonalDoc, nowMs = Date.now()) {
    const q = String(focused || '').toLowerCase().trim();
    const hit = s => !q || s.toLowerCase().includes(q);
    const cats = CATEGORIES.filter(c => hit(c.label)).map(c => ({ name: `${c.label} · ${c.hint}`.slice(0, 100), value: `cat:${c.key}` }));
    const { releases, leaving } = followable(seasonalDoc, nowMs);
    const entries = [
        ...releases.filter(e => hit(e.title)).map(e => ({ name: `${e.title} · when it releases`.slice(0, 100), value: `rel:${e.title}`.slice(0, 100) })),
        ...leaving.filter(e => hit(e.title)).map(e => ({ name: `${e.title} · when it is leaving`.slice(0, 100), value: `lv:${e.title}`.slice(0, 100) })),
    ];
    return (q ? [...entries, ...cats] : [...cats, ...entries]).slice(0, 25);
}

// ---------- The daily run ----------

// Failed sends, his rule (2026-10-23 20:21 EDT): after a failed set, a one-line note on their next command (noteDue); if the note was shown and DMs keep failing for 3 more days, the reminders pause. Returns the fields to set.
function failureUpdate(sub, nowMs) {
    const set = { failingSince: sub.failingSince || new Date(nowMs) };
    if (!sub.failingSince) set.noteDue = true;
    if (sub.noteShownAt && nowMs - new Date(sub.noteShownAt).getTime() >= 3 * DAY_MS) { set.pausedAt = new Date(nowMs); set.pauseNoteShown = false; }
    return set;
}
const isRefusal = err => [50278, 50007].includes(err?.code ?? err?.rawError?.code);

// In memory: who has a note waiting, so the note hook costs nothing for everyone else. Filled at boot and after each run.
const pendingNotice = new Set();
async function loadPendingNotices() {
    const ReminderSubscription = require('../models/ReminderSubscription');
    const rows = await ReminderSubscription.find({ $or: [{ noteDue: true }, { pausedAt: { $ne: null }, pauseNoteShown: false }] }, { discordId: 1 }).lean();
    pendingNotice.clear();
    rows.forEach(r => pendingNotice.add(r.discordId));
}

// The game's daily update is 00:00 UTC; the run is one minute after it (his round-1 Q4, 20:14 EDT: "00:01 utc. not 05").
const DAILY_RUN_UTC_MINUTE = 1;
function msUntilNextRun(nowMs = Date.now()) {
    const next = new Date(nowMs);
    next.setUTCHours(0, DAILY_RUN_UTC_MINUTE, 0, 0);
    if (next.getTime() <= nowMs) next.setUTCDate(next.getUTCDate() + 1);
    return next.getTime() - nowMs;
}

// Sends each person their DM, one at a time. Never throws. `only` limits it to one user id (the dev-bot test send).
async function runDailyReminders(client, { nowMs = Date.now(), only = null } = {}) {
    const result = { sent: 0, refused: 0, skipped: 0, errors: 0 };
    try {
        const SeasonalData = require('../models/SeasonalData');
        const ReminderSubscription = require('../models/ReminderSubscription');
        const { Routes } = require('discord.js');
        const doc = await SeasonalData.findOne({ docType: 'global' });
        if (!doc) return result;
        const due = computeDue(doc.toObject ? doc.toObject() : doc, nowMs);
        const query = { pausedAt: null, lastSentDay: { $ne: due.day } };
        if (only) { delete query.lastSentDay; query.discordId = only; }
        const subs = await ReminderSubscription.find(query).lean();
        let accentColor;
        try { accentColor = require('../commands/calendar').PRESET_ACCENT; } catch { /* default */ }
        for (const sub of subs) {
            const p = personalise(sub, due);
            const components = buildReminderDM(p, doc.toObject ? doc.toObject() : doc, { nowMs, accentColor });
            if (!components) { result.skipped++; continue; }
            try {
                const dm = await client.users.createDM(sub.discordId);
                await client.rest.post(Routes.channelMessages(dm.id), { body: { flags: 32768, allowed_mentions: { parse: [] }, components } });
                const left = (sub.follows || []).filter(f => !p.fired.includes(f));
                await ReminderSubscription.updateOne({ _id: sub._id }, { $set: { lastSentDay: due.day, follows: left, failingSince: null, noteDue: false, noteShownAt: null } });
                result.sent++;
            } catch (err) {
                if (isRefusal(err)) {
                    await ReminderSubscription.updateOne({ _id: sub._id }, { $set: { lastSentDay: due.day, ...failureUpdate(sub, nowMs) } });
                    result.refused++;
                } else {
                    // Not a refusal (a network fault, Discord down): nothing is marked, so tomorrow's run tries again.
                    console.error(`Reminder DM failed for one user: ${err?.message || 'Unknown error'}`);
                    result.errors++;
                }
            }
            await new Promise(r => setTimeout(r, 250)); // spacing the sends; discord.js handles real rate limits
        }
        await loadPendingNotices();
        console.log(`🔔 Daily reminders: ${result.sent} sent, ${result.refused} refused, ${result.skipped} with nothing today, ${result.errors} errors.`);
    } catch (error) {
        console.error(`Daily reminders failed: ${error?.message || 'Unknown error'}`);
    }
    return result;
}

// ---------- The note on someone's next command ----------

// After a command's own reply: if this person's reminders failed or were paused, one private line saying so, shown once. Never throws.
async function maybeShowReminderNote(interaction) {
    try {
        const userId = interaction.user?.id;
        if (!userId || !pendingNotice.has(userId)) return;
        pendingNotice.delete(userId);
        const ReminderSubscription = require('../models/ReminderSubscription');
        const sub = await ReminderSubscription.findOne({ discordId: userId }).lean();
        if (!sub) return;
        const fix = 'Turn on DMs from a server you share with Dioreo, or add Dioreo to your account.';
        if (sub.pausedAt && !sub.pauseNoteShown) {
            await interaction.followUp({ content: `${emojis.remindAlert} **Your reminders are paused:** they couldn't reach you for a few days. ${fix}`, components: [{ type: 1, components: [{ type: 2, style: 3, label: 'Turn back on', custom_id: `remind_resume:${userId}`, emoji: parseEmoji(emojis.reminderEnabled) }] }], flags: 64 });
            await ReminderSubscription.updateOne({ _id: sub._id }, { $set: { pauseNoteShown: true } });
        } else if (sub.noteDue) {
            await interaction.followUp({ content: `-# ${emojis.remindAlert} Your reminder DM couldn't reach you. ${fix}`, flags: 64 });
            await ReminderSubscription.updateOne({ _id: sub._id }, { $set: { noteDue: false, noteShownAt: new Date() } });
        }
    } catch (error) {
        console.error(`Reminder note failed: ${error?.message || 'Unknown error'}`);
    }
}

// ---------- The bell ----------

// The bell: a grey, emoji-only button as the accessory of a command's header (his round-3 Q2), opening the panel privately. Its icon is his AddReminder (2026-10-24 18:15 EDT: "use this for the icon only buttons"). Wraps a Text Display in a Section; anything else passes through unchanged.
function withBell(textComponent) {
    if (!textComponent || textComponent.type !== 10) return textComponent;
    return { type: 9, components: [textComponent], accessory: { type: 2, style: 2, custom_id: 'remind_open', emoji: parseEmoji(emojis.addReminder) } };
}

module.exports = {
    CATEGORIES, CATEGORY_KEYS, PANEL_GROUPS, MAX_OPTIONS,
    computeDue, personalise, buildReminderDM, buildTestDM, markFollowed,
    followable, buildPanel, mergeFollows, resolveSetValue, autocompleteChoices,
    failureUpdate, isRefusal, msUntilNextRun, runDailyReminders,
    pendingNotice, loadPendingNotices, maybeShowReminderNote, withBell,
};
