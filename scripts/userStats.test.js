// scripts/userStats.test.js -- Your Stats (added 2026-10-20 18:37 EDT): the streak rules, the summary, the page, and what each writer sends. No database: a fake model records the calls.
const assert = require('assert');
const { dayUpdate, summarize, noteCommand, noteCpPriced, commandKeyOf, hourLabel } = require('../utils/userStats');
const { buildStatsComponents } = require('../utils/statsPanel');

let failures = 0;
async function check(name, fn) { try { await fn(); console.log(`  ok   ${name}`); } catch (e) { failures++; console.error(`  FAIL ${name}\n       ${e.message}`); } }
const countAll = (n) => Array.isArray(n) ? n.reduce((a, c) => a + countAll(c), 0) : (n && typeof n === 'object' ? 1 + countAll(n.components || []) + (n.accessory ? 1 : 0) : 0);
const textOf = (cs) => JSON.stringify(cs);

(async () => {
    const at = new Date('2026-10-21T03:30:00Z'); // 23:30 Oct 20 in Toronto
    await check('the first command of a day starts a streak of 1 and counts a day', () => {
        const { set, inc } = dayUpdate(undefined, at, 'America/Toronto');
        assert.strictEqual(set['stats.lastDay'], '2026-10-20');
        assert.strictEqual(set['stats.streak'], 1);
        assert.strictEqual(inc['stats.days'], 1);
        assert.strictEqual(inc['stats.hours.23'], 1);
    });
    await check('yesterday continues the streak, in the user\'s own zone', () => {
        const { set } = dayUpdate({ lastDay: '2026-10-19', streak: 4, bestStreak: 4 }, at, 'America/Toronto');
        assert.strictEqual(set['stats.streak'], 5);
        assert.strictEqual(set['stats.bestStreak'], 5);
    });
    await check('a gap resets the streak but keeps the best', () => {
        const { set } = dayUpdate({ lastDay: '2026-10-10', streak: 9, bestStreak: 9 }, at, 'America/Toronto');
        assert.strictEqual(set['stats.streak'], 1);
        assert.strictEqual(set['stats.bestStreak'], 9);
    });
    await check('a second command the same day counts no new day', () => {
        const { set, inc } = dayUpdate({ lastDay: '2026-10-20', streak: 2 }, at, 'America/Toronto');
        assert.deepStrictEqual(set, {});
        assert.strictEqual(inc['stats.days'], undefined);
    });
    await check('a command bumps its own counter and the total, and keeps the earliest start', async () => {
        const calls = [];
        const model = { findOneAndUpdate: async (f, u, o) => { calls.push(u); return null; }, updateOne: async (f, u) => { calls.push(u); } };
        await noteCommand('1', 'gunsmith mp', at, model);
        assert.deepStrictEqual(calls[0].$inc, { 'stats.total': 1, 'stats.commands.gunsmith mp': 1 });
        assert.ok(calls[0].$min['stats.since']);
        assert.strictEqual(calls[1].$inc['stats.days'], 1);
    });
    await check('the command key carries the subcommand; a right-click is its label', () => {
        const slash = { isChatInputCommand: () => true, commandName: 'draw', options: { getSubcommandGroup: () => null, getSubcommand: () => 'calculator' } };
        assert.strictEqual(commandKeyOf(slash), 'draw calculator');
        assert.strictEqual(commandKeyOf({ isChatInputCommand: () => false, commandName: 'Convert Times' }), 'Convert Times');
    });
    await check('CP priced adds up and keeps the biggest', async () => {
        let u; await noteCpPriced('1', 9800, { updateOne: async (f, x) => { u = x; } });
        assert.deepStrictEqual(u, { $inc: { 'stats.cpPriced': 9800 }, $max: { 'stats.biggestCp': 9800 } });
    });
    const stats = { total: 412, days: 63, streak: 3, bestStreak: 9, shares: 12, cpPriced: 48200, biggestCp: 9800,
        commands: new Map([['settings', 20], ['gunsmith mp', 300], ['Convert Times', 4]]),
        builds: new Map([['a1', 64], ['b2', 54]]), hours: new Map([['9', 2], ['23', 40]]) };
    const loadouts = [{ _id: 'a1', weaponName: 'AK-47', buildName: 'Build 2', category: 'AR' }, { _id: 'b2', weaponName: 'Fennec', buildName: 'Standard Build', category: 'SMG' }];
    await check('the summary picks the favourite command, go-to build, class and hour', () => {
        const s = summarize(stats, loadouts);
        assert.strictEqual(s.topCommands[0][0], 'gunsmith mp');
        assert.strictEqual(s.topBuild.name, 'AK-47 · Build 2');
        assert.strictEqual(s.topClass, 'AR');
        assert.strictEqual(s.buildsOpened, 118);
        assert.strictEqual(hourLabel(s.peakHour), '11 PM');
    });
    await check('the page shows every section, under 40 components', () => {
        const s = { ...summarize(stats, loadouts), userNumber: 14, percentile: 92 };
        const cs = buildStatsComponents({ userId: '1', avatarUrl: 'https://x', summary: s, firstCommandAt: new Date() });
        const t = textOf(cs);
        for (const want of ['Your Stats', 'Dioreo user **#14**', '92%', '### Commands', '### Gunsmith', '### Draws', '### Habits', '`/gunsmith mp`', '**Convert Times**', 'set_stats_reset|1', 'set_page_0|1']) assert.ok(t.includes(want), want);
        assert.ok(countAll(cs) <= 38, `components ${countAll(cs)}`);
    });
    await check('nothing counted yet says so and disables Reset', () => {
        const cs = buildStatsComponents({ userId: '1', avatarUrl: 'https://x', summary: summarize(undefined), firstCommandAt: null });
        const t = textOf(cs);
        assert.ok(t.includes('Nothing counted yet'));
        assert.ok(!t.includes('### Gunsmith'));
        assert.ok(/"Reset My Stats","custom_id":"set_stats_reset\|1","disabled":true/.test(t));
    });
    await check('Reset asks first, with Cancel back to the page', () => {
        const t = textOf(buildStatsComponents({ userId: '1', avatarUrl: 'https://x', summary: summarize(stats, loadouts), resetArmed: true }));
        assert.ok(t.includes('set_stats_resetok|1') && t.includes('set_page_2|1') && t.includes('Dioreo User Since stays'));
    });
    process.exit(failures ? 1 : 0);
})();
