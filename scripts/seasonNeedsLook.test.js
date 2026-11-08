// scripts/seasonNeedsLook.test.js -- the Next Season Draft's Needs a Look card and where each staged row came from (2026-11-08 12:23 EST). No database.
const assert = require('assert');
const V = require('../handlers/manage/seasonPanel/views');
const DM = require('../utils/newsTriage/draftMerge');

let failed = 0;
function t(name, fn) { try { fn(); console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name}\n    ${e.message}`); } }
const D = s => new Date(s);
const news = (row, extra = {}) => ({ ...row, newsSource: { channelId: 'c', messageId: 'm', rank: 3, sig: DM.sig(row), ...extra } });

t('each row says where it came from: typed, news by source, carried over, or a news row he edited', () => {
    const typed = { title: 'Typed Draw', date: D('2026-11-12') };
    const official = news({ title: 'Official Draw', date: D('2026-11-12') });
    const leak = news({ title: 'Leak Draw', date: D('2026-11-12') }, { rank: 2 });
    const expected = news({ title: 'Expected Draw', date: D('2026-11-12') }, { rank: 1 });
    const carried = news({ title: 'Carried Draw', date: D('2026-10-20') }, { carried: true });
    const edited = { ...news({ title: 'Edited Draw', date: D('2026-11-12') }), date: D('2026-11-14') };
    assert.deepStrictEqual([typed, official, leak, expected, carried, edited].map(V.origin), ['typed', 'news, official', 'news, leak', 'news, expected leak', 'carried over', 'news, edited by you']);
});
t('Needs a Look names a draw with no picture, no items, or no calendar row, and a calendar draw with no draw', () => {
    const doc = { bpEnd: D('2026-11-12'), draft: { active: true, currentSeasonTitle: 'Season 10', bpStart: D('2026-11-12'), bpEndTBD: true, rankTitle: 'Ranked Series 4', rankEndTBD: true, dmzTitle: 'DMZ Season 2', dmzEndTBD: true,
        newDraws: [{ title: 'Bare Draw', date: D('2026-11-12'), thumbnailUrl: '', items: [] }, { title: 'Botanist Mythic Drop', date: D('2026-11-26'), thumbnailUrl: 'https://x', items: [{ tier: 'mythic', name: 'X' }] }],
        returningDraws: [], calendar: [{ title: 'Ghost Draw', category: 'draw', date: D('2026-11-12'), endDate: D('2026-11-20') }, { title: 'Bare Draw', category: 'draw', date: D('2026-11-12'), endDate: D('2026-11-20') }] } };
    const w = V.needsLook(doc).join('\n');
    assert.ok(/no picture: Bare Draw/.test(w), w);
    assert.ok(/no items: Bare Draw/.test(w));
    assert.ok(/not in the draw lists: Ghost Draw/.test(w));
    assert.ok(/no calendar row, so no end date: Botanist Mythic Drop/.test(w));
    assert.ok(!/No season title|Ranked not set|DMZ not set/.test(w), 'what is set is not listed');
});
t('an Alchemy-style name pair counts as one draw, not a calendar row with no draw', () => {
    const doc = { draft: { active: true, currentSeasonTitle: 'S', bpStart: D('2026-11-12'), bpEndTBD: true, rankTitle: 'R4', rankEndTBD: true, dmzTitle: 'D2', dmzEndTBD: true,
        newDraws: [], returningDraws: [{ title: 'Alchemy Stars Draw', date: D('2026-10-20'), thumbnailUrl: 'https://x', items: [{ tier: 'legendary', name: 'X' }] }],
        calendar: [{ title: 'Alchemy Stars — It Goes Two Draw', category: 'draw', date: D('2026-10-20'), endDate: D('2026-11-18'), newsSource: { carried: true, rank: 3, sig: 'x' } }] } };
    assert.ok(!/Alchemy/.test(V.needsLook(doc).join('\n')));
});
t('the card says when everything is ready, and counts where the rows came from', () => {
    const doc = { draft: { active: true, currentSeasonTitle: 'S', bpStart: D('2026-11-12'), bpEndTBD: true, rankTitle: 'R4', rankEndTBD: true, dmzTitle: 'D2', dmzEndTBD: true, newDraws: [], returningDraws: [], calendar: [] } };
    const all = JSON.stringify(V.needsLookView(doc));
    assert.ok(all.includes('Everything checked is ready') && all.includes('0 typed by you'));
});
t('the daily briefing still reads the same readiness through pipeline.js', () => {
    assert.strictEqual(require('../utils/newsTriage/pipeline').draftReadiness, require('../utils/newsTriage/readiness').draftReadiness);
});

console.log(failed ? `\n${failed} failed` : '\nseasonNeedsLook: all checks passed');
process.exit(failed ? 1 : 0);
