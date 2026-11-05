// scripts/newsTriageGrid.test.js -- the auto-draft merge (utils/newsTriage/draftMerge.js) run over a grid of generated posts, checking the rules that must hold whatever the posts say (built 2026-11-05 17:12 EST for the pre-PR checks: "a grid of scenarios" instead of the cases one pass happens to think of). No database, no network.
//
// Each run starts from a Next Season Draft holding rows he typed, a row news triage wrote and he then edited, and a row news triage wrote that is still as written. Then a seeded run of posts: official and leaked, draws, events and modes, new, changed, cancelled, dated and dateless, expected and confirmed, with and without an image, names that are the same item and names that only look alike. After every post, and at the end, the rules below are checked. A failure prints the seed and the step, so it can be replayed.
const assert = require('assert');
const M = require('../utils/newsTriage/draftMerge');
const { strictName } = require('../utils/newsTriage/resolve');

// mulberry32: the same seed gives the same run on every machine.
const rng = seed => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = (r, a) => a[Math.floor(r() * a.length)];
const D = s => new Date(`${s}T00:00:00Z`);
const clone = x => JSON.parse(JSON.stringify(x));
const json = x => JSON.stringify(x);

// Names that are the same item spelled differently, and names that only look alike (each was a real mix-up on the backtest or the invariants pass).
const NAMES = {
    draw: ['Street Fighter Series Armory', 'Street Fighter Series Armory II', 'Hunger Eternal', 'The Hunger Eternal Draw', 'Fang Wars', 'Fangs Wars', 'Halloween Series Armory', 'Grim Duo Draw', 'Sapphire Winter Draw'],
    event: ['Halloween Sale', 'Halloween Event', 'Halloween', 'Gunsmith Challenge', 'Gunsmith Challenge 2', 'Mythic Boost Event', 'Winter Festival'],
    mode: ['Nuketown', 'Nuketown Halloween', 'Kill Confirmed', "Leader's Kill Confirmed", 'Undead Siege'],
};
const DAYS = ['2026-11-12', '2026-11-14', '2026-11-19', '2026-11-26', '2026-12-03', '2026-12-10'];

function startingDraft() {
    const his = (title, extra = {}) => ({ _id: `his-${title}`, title, date: D('2026-11-12'), endDate: D('2026-11-30'), category: 'event', isOngoing: false, isDoubleCP: false, ...extra });
    const wrote = row => ({ ...row, newsSource: { channelId: 'leaks', messageId: 'old', rank: 2, dated: true, sig: M.sig(row) } });
    const edited = wrote({ _id: 'news-edited', title: 'Winter Festival', date: D('2026-12-01'), endDate: D('2026-12-20'), category: 'event', isOngoing: false, isDoubleCP: false });
    edited.endDate = D('2026-12-24'); // he moved the end after news triage wrote it
    return {
        currentSeasonTitle: '', bpStart: D('2026-11-12'), active: true,
        calendar: [his('Halloween Event'), his('Undead Siege', { category: 'playlist' }), edited, wrote({ _id: 'news-asis', title: 'Mythic Boost Event', date: D('2026-11-14'), endDate: D('2026-11-21'), category: 'event', isOngoing: false, isDoubleCP: false })],
        newDraws: [{ _id: 'his-draw', title: 'Grim Duo Draw', date: D('2026-11-12'), thumbnailUrl: 'his.png', items: [], priceType: '' }],
        returningDraws: [],
    };
}
const hisRows = d => [...(d.calendar || []), ...(d.newDraws || []), ...(d.returningDraws || [])].filter(r => !r.newsSource || M.sig(r) !== r.newsSource.sig);

function makeItem(r) {
    const kind = pick(r, ['draw', 'draw', 'event', 'event', 'mode']);
    const name = pick(r, NAMES[kind]);
    const dated = r() < 0.75;
    const start = dated ? D(pick(r, DAYS)) : D('2026-11-12');
    const end = dated && r() < 0.6 ? new Date(start.getTime() + pick(r, [7, 14, 21]) * 86400000) : null;
    return {
        kind, name, where: r() < 0.9 ? 'draft' : 'live', action: kind === 'draw' ? 'draw' : 'calendar',
        change: pick(r, ['new', 'new', 'new', 'returning', 'changed', 'cancelled']), certainty: r() < 0.3 ? 'expected' : 'confirmed',
        startText: dated ? 'Nov 12' : '', start, end, drawType: r() < 0.5 ? 'new' : 'returning', rewards: [], thumbnailUrl: kind === 'draw' && r() < 0.6 ? 'img.png' : '', doubleCP: r() < 0.1,
    };
}

let checks = 0; let posts = 0;
const SEEDS = Number(process.env.GRID_SEEDS || 400);
for (let seed = 1; seed <= SEEDS; seed++) {
    const r = rng(seed);
    const draft = startingDraft();
    const initial = clone(draft);
    const his0 = json(hisRows(draft));
    const undos = [];
    let n = 0; const id = () => `n${seed}-${++n}`;
    const steps = 4 + Math.floor(r() * 10);
    for (let step = 0; step < steps; step++) {
        const at = `seed ${seed}, post ${step + 1}`;
        const items = Array.from({ length: 1 + Math.floor(r() * 3) }, () => makeItem(r));
        const post = { id: `p${seed}-${step}`, channelId: 'c', official: r() < 0.3 };
        const before = clone(draft);
        const plan = M.planDraftChanges(draft, items, post, { newId: id });
        const { undo } = M.applyDraftChanges(draft, plan.changes);
        undos.push(undo); posts++;

        // 1. His rows, and rows he edited after news triage wrote them, never change.
        assert.strictEqual(json(hisRows(draft)), his0, `${at}: one of his rows changed`); checks++;
        // 2. Only draft items touch the draft.
        if (items.every(it => it.where !== 'draft')) { assert.strictEqual(json(draft), json(before), `${at}: a live item changed the draft`); checks++; }
        // 3. Every row news triage wrote carries a source whose sig matches it.
        for (const row of [...draft.calendar, ...draft.newDraws, ...draft.returningDraws]) if (row.newsSource && !hisRows(draft).includes(row)) { assert.strictEqual(row.newsSource.sig, M.sig(row), `${at}: ${row.title} has a stale sig`); checks++; }
        // 4. No item twice: no two rows in one list are the same item.
        for (const list of ['newDraws', 'returningDraws', 'calendar']) {
            const rows = draft[list];
            for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
                const twin = strictName(rows[i].title, rows[j].title) && (list !== 'calendar' || rows[i].category === rows[j].category);
                assert.ok(!twin, `${at}: ${list} holds "${rows[i].title}" and "${rows[j].title}"`); checks++;
            }
        }
        // 5. A kind he chose never to draft is never added.
        for (const row of [...draft.calendar, ...draft.newDraws]) if (![...initial.calendar, ...initial.newDraws].some(h => h._id === row._id)) { assert.ok(!M.skippedKind(row.title), `${at}: skipped kind ${row.title} drafted`); checks++; }
        // 9. A lower source never moves a date a higher one set.
        for (const list of ['newDraws', 'returningDraws', 'calendar']) for (const row of draft[list]) {
            const was = before[list].find(b => b._id === row._id);
            if (!was || !was.newsSource || hisRows(before).some(h => h._id === was._id) || was.newsSource.dated === false) continue;
            const rank = post.official ? 3 : 2;
            // Filling a date it left empty is allowed; changing one it set is not.
            if (rank < was.newsSource.rank) for (const k of ['date', 'endDate']) if (was[k]) { assert.strictEqual(json(row[k]), json(was[k]), `${at}: a rank-${rank} post moved ${row.title}'s ${k}, set by rank ${was.newsSource.rank}`); checks++; }
        }
        // 6. The same post read again changes nothing.
        const again = M.planDraftChanges(draft, items, post, { newId: id });
        assert.deepStrictEqual(again.changes.map(c => `${c.type} ${c.name}`), [], `${at}: re-reading the same post changes the draft again`); checks++;
        // 7. Undo puts the draft back exactly as it was before this post.
        const undone = M.undoDraftChanges(clone(draft), clone(undo));
        assert.strictEqual(json(undone), json(before), `${at}: Undo did not restore the draft`); checks++;
    }
    // 8. Undoing every post, newest first, gives back the starting draft.
    const back = clone(draft);
    for (const u of [...undos].reverse()) M.undoDraftChanges(back, clone(u));
    assert.strictEqual(json(back), json(initial), `seed ${seed}: undoing every post did not restore the starting draft`); checks++;
}
console.log(`✅ newsTriageGrid: ${SEEDS} runs, ${posts} posts, ${checks} checks passed`);
