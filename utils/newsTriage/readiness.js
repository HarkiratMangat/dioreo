// utils/newsTriage/readiness.js -- what the Next Season Draft has and lacks, read off the document alone. Moved out of pipeline.js (2026-11-08 12:23 EST) unchanged, so the daily briefing, the promote check and /manage's Needs a Look (handlers/manage/seasonPanel/views.js) all read the same checks, and /manage never requires the stateful pipeline.
const DAY_MS = 24 * 60 * 60 * 1000;

function draftReadiness(d) {
    const draft = d?.draft || {};
    const calendar = draft.calendar || []; const draws = [...(draft.newDraws || []), ...(draft.returningDraws || [])];
    if (!draft.active && !draft.bpStart && !calendar.length && !draws.length) return null;
    const day = x => (x ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][new Date(x).getUTCMonth()]} ${new Date(x).getUTCDate()}` : '');
    const sq = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const part = (title, def, end, tbd) => (title && title !== def ? `${title}${end ? `, ends ${day(end)}` : tbd ? ', end TBD' : ''}` : (end ? `ends ${day(end)}` : ''));
    return {
        title: draft.currentSeasonTitle || '', bpStart: day(draft.bpStart), bpEnd: draft.bpEndTBD ? 'TBD' : day(draft.bpEnd),
        ranked: part(draft.rankTitle, 'Ranked Series', draft.rankEnd, draft.rankEndTBD), dmz: part(draft.dmzTitle, 'DMZ Season', draft.dmzEnd, draft.dmzEndTBD),
        calendar: calendar.length, draws: draws.length, fromNews: [...calendar, ...draws].filter(r => r.newsSource).length,
        noImage: calendar.filter(r => r.category === 'draw' && !draws.some(x => sq(x.title) === sq(r.title))).map(r => r.title),
        noEnd: calendar.filter(r => (!r.endDate && !r.isOngoing) || (r.newsSource && r.newsSource.noEnd)).map(r => r.title),
        // Only rows the AI judged EXPECTED (rank 1). Rank 2 is a confirmed read from #leaks, which reposts CODM's own calendar: 35 of Season 9's 42 drafted rows, so listing it warned about nearly everything (2026-11-05 15:34 EST).
        leakOnly: [...calendar, ...draws].filter(r => r.newsSource && r.newsSource.rank === 1).map(r => r.title),
        stillRunning: draft.bpStart ? (d?.calendar || []).filter(r => !r.endDate && !r.isOngoing && r.date && new Date(r.date) > new Date(new Date(draft.bpStart) - 30 * DAY_MS) && !calendar.some(x => sq(x.title) === sq(r.title))).map(r => r.title) : [],
        // For the promote check (2026-11-05 15:23 EST): rows dated before the season starts that were not carried over (left from an earlier plan), draw rows with no calendar row (no dates on /calendar), the same title twice in one list, and a live season that does not end when this one starts.
        early: draft.bpStart ? calendar.filter(r => r.date && new Date(r.date) < new Date(new Date(draft.bpStart) - DAY_MS) && !(r.newsSource && r.newsSource.carried) && !(r.endDate && new Date(r.endDate) > new Date(draft.bpStart))).map(r => r.title) : [],
        noCalendar: draws.filter(x => !calendar.some(r => r.category === 'draw' && sq(r.title) === sq(x.title))).map(x => x.title),
        twice: [...new Set([...calendar.map(r => `${r.category}|${sq(r.title)}`), ...draws.map(x => `d|${sq(x.title)}`)].filter((k, i, a) => a.indexOf(k) !== i))].length,
        seamGap: draft.bpStart && d?.bpEnd && !d?.bpEndTBD && Math.abs(new Date(draft.bpStart) - new Date(d.bpEnd)) > DAY_MS / 2 ? `this season ends ${day(d.bpEnd)}, next starts ${day(draft.bpStart)}` : '',
        // Consumer audit (2026-11-05 17:18 EST): Promote to Live drops newsSource, so a row still on its placeholder date (a dateless item sits on the season start) reads on /calendar as starting on day one, with nothing left to say no post ever dated it.
        undated: [...calendar, ...draws].filter(r => r.newsSource && r.newsSource.dated === false).map(r => r.title),
        // fullBoxes (a /manage box near its 4,000 characters) retired 2026-11-09: the draft boxes open empty and add or update now (utils/draftPaste.js).
        startsAt: draft.bpStart || null,
        autoPromote: Boolean(draft.autoPromote && draft.bpStart),
    };
}

module.exports = { draftReadiness, DAY_MS };
