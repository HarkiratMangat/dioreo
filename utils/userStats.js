// utils/userStats.js -- "Your Stats": what a user did with Dioreo, counted from v3 (added 2026-10-20 18:35 EDT, Harkirat approved 2026-10-20 18:16 EDT). 🔴 This is a SEPARATE, identified record on the user's own UserPreference, shown only to them (and to anyone they show /settings to). It is never read from AnalyticsEvent: those rows are keyed by an HMAC hash precisely so they can't be tied back to a person (PRIVACY §2.4b), and re-hashing an id to look them up would break that promise. Every writer is fire-and-forget: a stats write must never fail or slow the command that triggered it. Counting is per user and per action, never per message, so a re-render does not count twice unless the user clicked again.
const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/utc'));
dayjs.extend(require('dayjs/plugin/timezone'));
const UserPreference = require('../models/UserPreference');

const DEFAULT_ZONE = 'America/Toronto';
const keyOf = (s) => String(s).replace(/[.$]/g, '_');

function safely(promise, what) {
    Promise.resolve(promise).catch((error) => console.error(`Failed to record ${what} stat:`, error));
}

// The day fields for a command at `at`: a new day bumps `days`, and continues the streak only when the last active day was yesterday in the user's own zone.
function dayUpdate(prev, at, zone) {
    const local = dayjs(at).tz(zone || DEFAULT_ZONE);
    const today = local.format('YYYY-MM-DD');
    const yesterday = local.subtract(1, 'day').format('YYYY-MM-DD');
    const set = {}; const inc = { [`stats.hours.${local.hour()}`]: 1 };
    if (prev?.lastDay !== today) {
        const streak = prev?.lastDay === yesterday ? (prev.streak || 0) + 1 : 1;
        Object.assign(set, { 'stats.lastDay': today, 'stats.streak': streak, 'stats.bestStreak': Math.max(streak, prev?.bestStreak || 0) });
        inc['stats.days'] = 1;
    }
    return { set, inc };
}

// An own command: a slash command or right-click the user ran themselves (handlers/router.js calls this after it runs).
async function noteCommand(userId, commandKey, at = new Date(), model = UserPreference) {
    if (!userId || !commandKey) return;
    const before = await model.findOneAndUpdate(
        { discordId: userId },
        { $inc: { 'stats.total': 1, [`stats.commands.${keyOf(commandKey)}`]: 1 }, $set: { 'stats.lastUsedAt': at }, $min: { 'stats.since': at } },
        { upsert: true, returnDocument: 'before', projection: { timezone: 1, 'stats.lastDay': 1, 'stats.streak': 1, 'stats.bestStreak': 1 } }
    );
    const { set, inc } = dayUpdate(before?.stats, at, before?.timezone);
    await model.updateOne({ discordId: userId }, { $inc: inc, ...(Object.keys(set).length ? { $set: set } : {}) });
}

async function noteBuildOpened(userId, buildId, model = UserPreference) {
    if (!userId || !buildId) return;
    await model.updateOne({ discordId: userId }, { $inc: { [`stats.builds.${keyOf(buildId)}`]: 1 } }, { upsert: true });
}

async function noteCpPriced(userId, cp, model = UserPreference) {
    if (!userId || !(cp > 0)) return;
    await model.updateOne({ discordId: userId }, { $inc: { 'stats.cpPriced': cp }, $max: { 'stats.biggestCp': cp } }, { upsert: true });
}

async function noteShare(userId, model = UserPreference) {
    if (!userId) return;
    await model.updateOne({ discordId: userId }, { $inc: { 'stats.shares': 1 } }, { upsert: true });
}

// Reset my stats: the whole object goes. firstCommandAt ("Dioreo User Since") is not a stat and stays.
async function resetStats(userId, model = UserPreference) {
    await model.updateOne({ discordId: userId }, { $unset: { stats: 1 } });
}

// What the page shows, worked out from the record alone (pure, tested). `loadouts` is the Loadout docs for the builds this user opened.
function summarize(stats, loadouts = []) {
    const entries = (m) => (m instanceof Map ? [...m.entries()] : Object.entries(m || {}));
    const commands = entries(stats?.commands).sort((a, b) => b[1] - a[1]);
    const builds = entries(stats?.builds).sort((a, b) => b[1] - a[1]);
    const byId = new Map(loadouts.map((l) => [String(l._id), l]));
    const classes = new Map();
    for (const [id, n] of builds) { const l = byId.get(id); if (l) classes.set(l.category, (classes.get(l.category) || 0) + n); }
    const hours = entries(stats?.hours).sort((a, b) => b[1] - a[1]);
    const topBuildDoc = builds.length ? byId.get(builds[0][0]) : null;
    return {
        total: stats?.total || 0,
        days: stats?.days || 0,
        streak: stats?.streak || 0,
        bestStreak: stats?.bestStreak || 0,
        topCommands: commands.slice(0, 5),
        buildsOpened: builds.reduce((n, [, c]) => n + c, 0),
        topBuild: topBuildDoc ? { name: `${topBuildDoc.weaponName} · ${topBuildDoc.buildName}`, count: builds[0][1] } : null,
        topClass: [...classes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null,
        peakHour: hours.length ? Number(hours[0][0]) : null,
        cpPriced: stats?.cpPriced || 0,
        biggestCp: stats?.biggestCp || 0,
        shares: stats?.shares || 0,
    };
}

// "11 PM" from 23.
function hourLabel(h) { return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`; }

// Everything the page needs that is not on the user's own record: their number by first command, the share of counted users they out-ran, and the builds they opened.
async function loadStatsView(prefs) {
    const Loadout = require('../models/Loadout');
    const stats = prefs?.stats;
    const buildIds = [...(stats?.builds?.keys?.() || Object.keys(stats?.builds || {}))];
    const [loadouts, earlier, counted, behind] = await Promise.all([
        buildIds.length ? Loadout.find({ _id: { $in: buildIds } }, { weaponName: 1, buildName: 1, category: 1 }).lean().catch(() => []) : [],
        prefs?.firstCommandAt ? UserPreference.countDocuments({ firstCommandAt: { $lt: prefs.firstCommandAt } }) : null,
        UserPreference.countDocuments({ 'stats.total': { $gt: 0 } }),
        stats?.total ? UserPreference.countDocuments({ 'stats.total': { $gt: 0, $lt: stats.total } }) : 0,
    ]);
    const summary = summarize(stats, loadouts);
    summary.userNumber = earlier === null ? null : earlier + 1;
    // Only meaningful with a few people to compare against.
    summary.percentile = counted >= 5 && stats?.total ? Math.floor((behind / (counted - 1)) * 100) : null;
    return summary;
}

// The router's one call after an own command: Dioreo User Since first, then the stats, in order, so the two never race to create the same record.
function commandKeyOf(interaction) {
    if (!interaction.isChatInputCommand?.()) return interaction.commandName;
    const group = interaction.options?.getSubcommandGroup?.(false);
    const sub = interaction.options?.getSubcommand?.(false);
    return [interaction.commandName, group, sub].filter(Boolean).join(' ');
}
async function noteOwnCommand(interaction) {
    const userId = interaction.user?.id;
    if (!userId) return;
    await require('./firstCommand').noteFirstCommand(userId);
    await noteCommand(userId, commandKeyOf(interaction));
}

module.exports = {
    commandKeyOf, noteOwnCommandSafely: (i) => safely(noteOwnCommand(i), 'own command'),
    noteCommand, noteBuildOpened, noteCpPriced, noteShare, resetStats, summarize, hourLabel, loadStatsView, dayUpdate,
    noteBuildOpenedSafely: (u, b) => safely(noteBuildOpened(u, b), 'build'),
    noteCpPricedSafely: (u, cp) => safely(noteCpPriced(u, cp), 'CP priced'),
    noteShareSafely: (u) => safely(noteShare(u), 'share'),
};
