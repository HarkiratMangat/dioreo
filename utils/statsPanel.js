// utils/statsPanel.js -- the Your Stats page of /settings (page 2), drawn from utils/userStats.js's summary (added 2026-10-20 18:36 EDT). Pure: no database, no Discord calls, so scripts/userStats.test.js renders it directly. Layout: a header Section with the avatar, then one short block per kind of stat, each skipped when there is nothing to show, then Back and Reset. Headings are plain so the numbers carry the page.
const { hourLabel } = require('./userStats');

const fmt = (n) => Number(n || 0).toLocaleString('en-US');
// A slash command's key is lowercase ("gunsmith mp"); a right-click's is its label ("Convert Times").
const commandLabel = (key) => (/^[a-z]/.test(key) ? `\`/${key}\`` : `**${key}**`);

function buildStatsComponents({ userId, avatarUrl, summary, firstCommandAt, resetArmed = false, titleEmoji = '' }) {
    const s = summary;
    const since = firstCommandAt ? Math.floor(new Date(firstCommandAt).getTime() / 1000) : null;
    const who = [s.userNumber ? `Dioreo user **#${s.userNumber}**` : null, since ? `since <t:${since}:D>` : null].filter(Boolean).join(' · ');
    const header = [`# ${titleEmoji ? titleEmoji + ' ' : ''}Your Stats`, `### <@${userId}>`, who ? `-# ${who}` : null,
        s.percentile !== null && s.percentile !== undefined ? `-# More active than **${s.percentile}%** of Dioreo users` : null].filter(Boolean).join('\n');
    const out = [{ type: 9, components: [{ type: 10, content: header }], accessory: { type: 11, media: { url: avatarUrl } } }];
    const block = (text) => out.push({ type: 14, spacing: 2, divider: true }, { type: 10, content: text });

    if (!s.total) {
        block('Nothing counted yet.\n-# Your stats start with your next command.');
    } else {
        const top = s.topCommands.slice(0, 3).map(([k, n]) => `${commandLabel(k)} **${fmt(n)}**`).join(' · ');
        block(`### Commands\n**${fmt(s.total)}** commands run · **${fmt(s.days)}** ${s.days === 1 ? 'day' : 'days'} active${top ? `\n-# Most used: ${top}` : ''}`);
        if (s.buildsOpened) {
            const go = s.topBuild ? `Go-to build: **${s.topBuild.name}** (opened ${fmt(s.topBuild.count)}×)` : `**${fmt(s.buildsOpened)}** builds opened`;
            const extra = [s.topClass ? `Favourite class: **${s.topClass}**` : null, s.topBuild ? `**${fmt(s.buildsOpened)}** builds opened` : null].filter(Boolean).join(' · ');
            block(`### Gunsmith\n${go}${extra ? `\n-# ${extra}` : ''}`);
        }
        if (s.cpPriced) block(`### Draws\n**${fmt(s.cpPriced)} CP** priced${s.biggestCp ? `\n-# Biggest calculation: **${fmt(s.biggestCp)} CP**` : ''}`);
        const habits = [s.peakHour !== null ? `Most active around **${hourLabel(s.peakHour)}**` : null].filter(Boolean);
        const small = [`Streak **${fmt(s.streak)}** ${s.streak === 1 ? 'day' : 'days'}`, `best **${fmt(s.bestStreak)}**`, s.shares ? `**${fmt(s.shares)}** ${s.shares === 1 ? 'panel' : 'panels'} shared` : null].filter(Boolean).join(' · ');
        block(`### Habits\n${habits.join('\n')}${habits.length ? '\n' : ''}-# ${small}`);
    }

    out.push({ type: 14, spacing: 2, divider: true });
    if (resetArmed) {
        out.push({ type: 10, content: '**Reset your stats?**\n-# Every count above goes back to zero. Dioreo User Since stays.' },
            { type: 1, components: [
                { type: 2, style: 4, label: 'Yes, Reset', custom_id: `set_stats_resetok|${userId}` },
                { type: 2, style: 2, label: 'Cancel', custom_id: `set_page_2|${userId}` },
            ] });
    } else {
        out.push({ type: 10, content: '-# Counted since Dioreo v3.' },
            { type: 1, components: [
                { type: 2, style: 2, label: 'Back to Settings', custom_id: `set_page_0|${userId}` },
                { type: 2, style: 4, label: 'Reset My Stats', custom_id: `set_stats_reset|${userId}`, disabled: !s.total },
            ] });
    }
    return out;
}

module.exports = { buildStatsComponents, commandLabel };
