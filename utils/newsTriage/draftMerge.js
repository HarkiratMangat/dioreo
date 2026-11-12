// utils/newsTriage/draftMerge.js -- news triage fills the Next Season Draft itself (Harkirat, 2026-11-04 23:49 EST: "yeah", to auto-filling the draft instead of a card per item). Pure: the draft in, a list of changes out, and the same changes applied or undone on a plain object. core/ops/season.js's `season.newsDraft` runs them inside a transaction; the Season 9 backtest runs them on a simulated draft.
//
// Why it is more than "push each row" (measured on the 60-day Season 9 backtest, 2026-11-04 23:29 EST): pushing rows as they came left 14 second copies (an early leak, then the official post), drafted events that never happened, and lost every item still running when the season flipped. So:
//   - one item, one row: a later read UPDATES the row it matches, never adds a second
//   - a better source wins: official > confirmed leak > expected leak; a lower one never overwrites a higher one
//   - an expected leak with no date is held, not drafted, until a post dates or confirms it
//   - a cancellation removes the row news triage added
//   - a row he typed, or one he edited after news triage wrote it, is never touched (its `newsSource.sig` no longer matches)
//   - kinds he never lists (crates, boosts, livestreams, tournaments, stores, patch notes) are not drafted
// The draft stays staged: nothing a player sees changes until his Promote to Live.

const { seasonTitle, strictName } = require('./resolve');

const RANK = { expected: 1, confirmed: 2, official: 3 };
// Kinds absent from every row of his Season 9 (35 items): crates, lucky boxes, strongboxes, boosts, livestreams, tournaments, ranked festivals, store pages. A sale IS listed (Halloween Sale), so it is not here. The kinds he can switch off from the daily briefing (2026-11-05 15:23 EST, his pick 3: "Let you pick from the briefing which kinds to skip"). The default set is the old fixed list, so nothing changes until he picks; sales and offers are drafted by default because his Season 9 list has a sale.
const KIND_GROUPS = {
    crates: { label: 'Crates & lucky boxes', re: /\b(lucky ?box(es)?|strong ?box(es)?|crates?|secret cache|caches?)\b/i },
    boosts: { label: 'Boosts & supply drops', re: /\b(boosts?|supply drops?|supply)\b/i },
    streams: { label: 'Streams & tournaments', re: /\b(livestreams?|tournaments?|invitationals?|creator)\b/i },
    festivals: { label: 'Festivals', re: /\bfestival\b/i },
    stores: { label: 'Stores', re: /\bstores?\b/i },
    offers: { label: 'Offers & sales', re: /\b(offers?|sales?)\b/i },
    logins: { label: 'Login events', re: /\blog-?in\b/i },
};
const DEFAULT_SKIP = ['crates', 'boosts', 'streams', 'festivals', 'stores'];
const skippedKind = (name, keys = DEFAULT_SKIP) => (keys || []).find(k => KIND_GROUPS[k] && KIND_GROUPS[k].re.test(String(name || ''))) || null;
const SKIP_KIND = new RegExp(DEFAULT_SKIP.map(k => KIND_GROUPS[k].re.source).join('|'), 'i');
const CATEGORY = { draw: 'draw', mode: 'playlist', event: 'event' };
const DRAW_LISTS = ['newDraws', 'returningDraws'];

const day = d => (d ? new Date(d).toISOString().slice(0, 10) : '');
// What news triage wrote, so a later run can tell a row he edited from one it may still update.
const sig = row => [row.title || '', day(row.date), day(row.endDate)].join('|');
// The strict name match is resolve.js's strictName, so the merge and resolve's own skips and fixes agree on what counts as the same item (invariants pass, 2026-11-05 17:06 EST).
const same = strictName;

function rankOf(item, post) {
    if (post?.official) return RANK.official;
    return item.certainty === 'expected' ? RANK.expected : RANK.confirmed;
}

// Where an item would sit: the draw lists and/or the calendar.
function findRows(draft, name, kind) {
    const out = [];
    if (kind === 'draw') for (const list of DRAW_LISTS) (draft[list] || []).forEach((row, i) => { if (same(row.title, name)) out.push({ list, row, i }); });
    (draft.calendar || []).forEach((row, i) => { if (same(row.title, name) && (row.category || 'event') === CATEGORY[kind]) out.push({ list: 'calendar', row, i }); });
    return out;
}

// draft: the SeasonalData `draft` sub-document (plain). items: resolve.js card items. post: { id, channelId, official }. newId: makes an _id for a new row.
function planDraftChanges(draftIn, items, post, { newId, skipKinds = DEFAULT_SKIP } = {}) {
    const changes = []; const notes = []; const needsBox = [];
    // Planned against a working copy that takes each item's changes as it goes, so two items in one post (a calendar image and its caption naming the same armory) become one row, not two.
    const draft = JSON.parse(JSON.stringify(draftIn || {}));
    const makeId = newId || (() => new (require('mongoose').Types.ObjectId)());
    const source = rank => ({ channelId: post.channelId || '', messageId: post.id || '', rank });
    // One post naming the same item twice (a calendar image and its caption, with two dates) is one item: the first mention wins and the later ones only fill what it left out. Planned one after the other, the second flipped the first's date and a re-read of the same post flipped it back, writing changes every time (the scenario grid, 2026-11-05 17:13 EST).
    const merged = [];
    // A post that cancels an item and also announces it is moving it: the announcement stands, and the cancellation is dropped (else every re-read removed the row and added it back).
    const announced = (items || []).filter(i => i.change !== 'cancelled');
    for (const item of items || []) {
        if (item.change === 'cancelled' && announced.some(a => a.where === item.where && a.kind === item.kind && same(a.name, item.name))) continue;
        const twin = merged.find(m => m.where === item.where && m.kind === item.kind && m.change !== 'cancelled' && item.change !== 'cancelled' && same(m.name, item.name));
        if (!twin) { merged.push({ ...item }); continue; }
        for (const k of ['startText', 'start', 'end', 'thumbnailUrl']) if (!twin[k] && item[k]) twin[k] = item[k];
        if (!(twin.rewards || []).length && (item.rewards || []).length) twin.rewards = item.rewards;
        if (item.doubleCP) twin.doubleCP = true;
    }
    for (const item of merged) {
        const mark = changes.length;
        planItem(item);
        applyDraftChanges(draft, changes.slice(mark));
    }
    return { changes, notes, needsBox };

    function planItem(item) {
        if (item.where !== 'draft') return;
        const rank = rankOf(item, post);
        if (item.kind === 'season') {
            // The main season sets its title and start; the battle pass, ranked and DMZ parts set their own title and dates (2026-11-05 11:06 EST: CODM's Season 10 post named the DMZ season, and it had been filed as an event). Each field only when the draft does not have it, so nothing he typed is replaced; a default title ('Ranked Series') counts as not set.
            const part = item.part || 'main';
            const title = part === 'main' ? seasonTitle(item.name) : String(item.name || '').trim();
            const set = {};
            const empty = (k, def) => !draft[k] || draft[k] === def;
            // A better source replaces a season field news triage set itself (`newsSeasonSet` records the rank and the value it wrote); one he changed since is his (the fresh review R1, 2026-11-05 20:14 EST: a datamine's "Season 10 starts Nov 13" stuck after the official post said Nov 12, and the carry-over, promote check and placeholder dates all hang on bpStart).
            const ns = { ...(draft.newsSeasonSet || {}) }; let nsChanged = false;
            const val = v => (v instanceof Date ? v.toISOString() : v ?? null);
            const put = (k, v, isEmpty) => {
                const prev = ns[k];
                const ours = prev && prev.value === val(draft[k]);
                if (isEmpty || (ours && rank > (prev.rank || 0) && val(v) !== val(draft[k]))) { set[k] = v; ns[k] = { rank, value: val(v) }; nsChanged = true; }
            };
            if (part === 'main') { if (title) put('currentSeasonTitle', title, !draft.currentSeasonTitle); if (item.start) put('bpStart', new Date(item.start), !draft.bpStart); }
            const P = { 'battle pass': ['bp', 'Battle Pass'], ranked: ['rank', 'Ranked Series'], dmz: ['dmz', 'DMZ Season'] }[part];
            if (P) {
                const [k, def] = P;
                if (title) put(`${k}Title`, title, empty(`${k}Title`, def));
                if (item.start) put(`${k}Start`, new Date(item.start), !draft[`${k}Start`]);
                if (item.end) { put(`${k}End`, new Date(item.end), !draft[`${k}End`]); if (set[`${k}End`]) set[`${k}EndTBD`] = false; }
            }
            if (nsChanged) set.newsSeasonSet = ns;
            if (Object.keys(set).length) changes.push({ type: 'season', set, name: title });
            else notes.push({ name: title, why: 'the draft already has its title and start' });
            return;
        }
        if (item.kind === 'patch') { notes.push({ name: item.name, why: 'patch notes go through Add to Patch Notes' }); return; }
        if (!CATEGORY[item.kind]) return;
        const skipKind = skippedKind(item.name, skipKinds);
        if (skipKind) { notes.push({ name: item.name, why: `a kind you don't list (${KIND_GROUPS[skipKind].label.toLowerCase()})` }); return; }

        const found = findRows(draft, item.name, item.kind);
        if (item.change === 'cancelled') {
            for (const f of found) {
                const written = f.row.newsSource && sig(f.row) === f.row.newsSource.sig;
                // A cancellation from a lower source than the one that listed it is only a note: a #leaks "cancelled" (or a misread "postponed") removed an official row (the fresh review R1, 2026-11-05 20:14 EST).
                if (written && rank >= (f.row.newsSource.rank || 0)) changes.push({ type: 'remove', list: f.list, id: String(f.row._id), name: f.row.title });
                else if (written) notes.push({ name: f.row.title, why: 'cancelled by a lower source than the one that listed it: check, and remove it yourself if it is' });
                else notes.push({ name: f.row.title, why: 'cancelled, but you added or edited it: remove it yourself' });
            }
            if (!found.length) notes.push({ name: item.name, why: 'cancelled; it was not in the draft' });
            return;
        }
        // `startText`, not `start`: resolve.js fills a dateless draft item with the next season's start, which is a placeholder, not a date the post gave ("Dark Draw" and "Red Moon" were drafted on that placeholder in the backtest).
        if (!item.startText && rank === RANK.expected) { notes.push({ name: item.name, why: 'leaked with no date: held until a post dates or confirms it' }); return; }

        const wanted = [];
        // A draft draw row needs an image, as /manage's bulk draft add requires (core/ops/season.js bulkDraftDraws drops one without). With none found, its calendar row is still drafted and the card keeps an Add button for the draw.
        const hasDrawRow = found.some(f => f.list !== 'calendar');
        if (item.kind === 'draw' && !item.thumbnailUrl && !hasDrawRow) { needsBox.push(item); notes.push({ name: item.name, why: 'no image found, so only its calendar row is drafted: add the draw with its Add to Next Season Draft button' }); }
        if (item.kind === 'draw' && (item.thumbnailUrl || hasDrawRow)) wanted.push({ list: item.drawType === 'returning' ? 'returningDraws' : 'newDraws', row: { title: item.name, date: item.start || null, items: (item.rewards || []).map(r => ({ tier: r.tier, name: r.name })), thumbnailUrl: item.thumbnailUrl || '', priceType: '' } });
        // No end from the post is written All Season with `newsSource.noEnd` (the fresh review R1, 2026-11-05 20:14 EST): /manage's calendar box has no way to write a missing end, so a null end came back as "Invalid Date", and its save dropped the row from the draft without a word. The first post that gives an end replaces it, and the briefing and promote check list it until then.
        wanted.push({ list: 'calendar', row: { title: item.name, date: item.start || null, endDate: item.end || null, category: CATEGORY[item.kind], isOngoing: !item.end, isDoubleCP: Boolean(item.doubleCP) } });

        for (const w of wanted) {
            const hit = found.find(f => (w.list === 'calendar') === (f.list === 'calendar'));
            if (!hit) {
                const row = { ...w.row, _id: makeId() };
                // A dateless confirmed item sits on the next season's start as a placeholder (resolve.js); `dated: false` lets any later post that gives a real date replace it, whatever its rank (Grim Duo kept the placeholder in the backtest).
                row.newsSource = { ...source(rank), dated: Boolean(item.startText), sig: sig(row), ...(w.list === 'calendar' && !row.endDate ? { noEnd: true } : {}) };
                changes.push({ type: 'add', list: w.list, row, name: row.title });
                // A near-name already staged ("Ford Table Tactics Offer" beside this "… Event", 2026-11-11 21:25 EST, the same thing twice on prod): added anyway, since the words alone cannot prove it, but the card says so, and the review before Promote lists the pair (utils/promoteReview.js).
                const { core } = require('../promoteReview');
                const pool = w.list === 'calendar' ? (draft.calendar || []) : [...(draft.newDraws || []), ...(draft.returningDraws || [])];
                const twin = core(row.title) && pool.find(x => x && x.title !== row.title && core(x.title) === core(row.title));
                if (twin) notes.push({ name: row.title, why: `looks like "${twin.title}", already staged: check it is not the same thing` });
                continue;
            }
            const cur = hit.row;
            if (!cur.newsSource) { notes.push({ name: cur.title, why: 'already in the draft (you added it)' }); continue; }
            if (sig(cur) !== cur.newsSource.sig) { notes.push({ name: cur.title, why: 'you edited it, so it was left alone' }); continue; }
            const better = rank > (cur.newsSource.rank || 0); const asGood = rank >= (cur.newsSource.rank || 0);
            const set = {};
            if (better && w.row.title !== cur.title) set.title = w.row.title;
            const placeholder = cur.newsSource.dated === false;
            // A lower source never moves a higher one's date, even when it says the date changed (the scenario grid, 2026-11-05 17:13 EST: the rule above said so and `|| changed` let a leak's "changed" move an official date). The same or a better source does.
            if (item.startText && w.row.date && (!cur.date || placeholder || (asGood && day(w.row.date) !== day(cur.date)))) set.date = w.row.date;
            if (w.list === 'calendar' && w.row.endDate && (!cur.endDate || (asGood && day(w.row.endDate) !== day(cur.endDate)))) set.endDate = w.row.endDate;
            if (set.endDate && cur.isOngoing && cur.newsSource.noEnd) set.isOngoing = false;
            if (w.list !== 'calendar' && !cur.thumbnailUrl && w.row.thumbnailUrl) set.thumbnailUrl = w.row.thumbnailUrl;
            if (w.list !== 'calendar' && !(cur.items || []).length && w.row.items.length) set.items = w.row.items;
            if (!Object.keys(set).length) continue;
            const next = { ...cur, ...set };
            changes.push({ type: 'update', list: hit.list, id: String(cur._id), set: { ...set, newsSource: { ...source(Math.max(rank, cur.newsSource.rank || 0)), dated: Boolean(set.date) || !placeholder, sig: sig(next), ...(cur.newsSource.noEnd && !set.endDate ? { noEnd: true } : {}) } }, name: next.title });
        }
    }
}

// Carry-over: a live row still running when the next season starts would vanish at Promote to Live (core/ops/season.js copies the draft's lists over the live ones), as the Herrscher draws would have in Season 9. Those rows are copied into the draft, marked as carried.
function planCarryOver(draft, live, { newId } = {}) {
    const start = draft.bpStart ? new Date(draft.bpStart) : null;
    if (!start) return { changes: [], notes: [] };
    const makeId = newId || (() => new (require('mongoose').Types.ObjectId)());
    const changes = [];
    const running = (live.calendar || []).filter(r => r.endDate && new Date(r.endDate) > start);
    for (const r of running) {
        const have = (draft.calendar || []).find(d => same(d.title, r.title) && (d.category || 'event') === (r.category || 'event'));
        if (have) {
            // A carried row follows its live row until Promote to Live (the fresh review R1, 2026-11-05 20:14 EST): it was copied once, so an end he extended on the live bot was put back to the old one at Promote.
            if (have.newsSource?.carried && sig(have) === have.newsSource.sig && (day(have.date) !== day(r.date) || day(have.endDate) !== day(r.endDate) || Boolean(have.isOngoing) !== Boolean(r.isOngoing))) {
                const next = { ...have, date: r.date || null, endDate: r.endDate, isOngoing: Boolean(r.isOngoing) };
                changes.push({ type: 'update', list: 'calendar', id: String(have._id), set: { date: next.date, endDate: next.endDate, isOngoing: next.isOngoing, newsSource: { ...have.newsSource, sig: sig(next) } }, name: have.title });
            }
        } else {
            const row = { title: r.title, date: r.date || null, endDate: r.endDate, category: r.category || 'event', isOngoing: Boolean(r.isOngoing), isDoubleCP: Boolean(r.isDoubleCP), _id: makeId() };
            row.newsSource = { channelId: '', messageId: '', rank: RANK.official, carried: true, sig: sig(row) };
            changes.push({ type: 'add', list: 'calendar', row, name: row.title });
        }
        if ((r.category || 'event') !== 'draw') continue;
        // The draw is carried even when its calendar row is already in the draft (2026-11-08 12:03 EST): the click-walk found Alchemy Stars, still running until Nov 18, with its row in the draft and no draw, because the row was news-written under another name and this loop moved on at the row. A draw is found by its /draws name or, failing that, the same draw under the row's name (utils/search.js isSameDrawTitle), and keeps its /draws name (Harkirat, 11:52 EST: "when a /draws and /calendar name for the exact same draw differ, utilize the /draw's name").
        const { isSameDrawTitle, bestDrawMatch } = require('../search');
        for (const list of DRAW_LISTS) {
            const d = (live[list] || []).find(x => same(x.title, r.title)) || bestDrawMatch(live[list] || [], r.title);
            if (!d || DRAW_LISTS.some(l => (draft[l] || []).some(x => same(x.title, d.title) || isSameDrawTitle(x.title, d.title)))) continue;
            const drow = { title: d.title, date: d.date || null, thumbnailUrl: d.thumbnailUrl || '', priceType: d.priceType || '', items: (d.items || []).map(i => ({ tier: i.tier, name: i.name })), _id: makeId() };
            drow.newsSource = { channelId: '', messageId: '', rank: RANK.official, carried: true, sig: sig(drow) };
            changes.push({ type: 'add', list, row: drow, name: drow.title });
        }
    }
    // A carried row whose live row was deleted, or now ends before the season starts, goes: Promote to Live would bring it back (the fresh review R1, 2026-11-05 20:14 EST). Never when the live calendar reads empty, which is a failed read, not a deletion.
    if ((live.calendar || []).length) {
        for (const d of draft.calendar || []) {
            if (!d.newsSource?.carried || sig(d) !== d.newsSource.sig) continue;
            if (running.some(r => same(r.title, d.title) && (r.category || 'event') === (d.category || 'event'))) continue;
            changes.push({ type: 'remove', list: 'calendar', id: String(d._id), name: d.title });
            if ((d.category || 'event') === 'draw') for (const list of DRAW_LISTS) for (const x of draft[list] || []) if (x.newsSource?.carried && sig(x) === x.newsSource.sig && same(x.title, d.title)) changes.push({ type: 'remove', list, id: String(x._id), name: x.title });
        }
    }
    return { changes, notes: [] };
}

// Applies changes to a plain draft object (mutated) and returns what undoes them. Each update and remove re-checks the row is still what news triage wrote, so a change planned a moment ago cannot overwrite an edit he made since.
function applyDraftChanges(draft, changes) {
    const undo = { added: [], updated: [], removed: [], seasons: [] };
    const applied = [];
    for (const c of changes || []) {
        if (c.type === 'season') {
            // `_after` is what this change set: undo puts a field back only while it still holds that value, so a title he typed since is never wiped.
            undo.seasons.push({ _before: { ...Object.fromEntries(Object.keys(c.set).map(k => [k, draft[k] ?? null])), active: Boolean(draft.active) }, _after: JSON.parse(JSON.stringify(c.set)) });
            Object.assign(draft, c.set, { active: true });
            applied.push(c); continue;
        }
        const list = (draft[c.list] = draft[c.list] || []);
        if (c.type === 'add') { list.push(c.row); undo.added.push({ list: c.list, id: String(c.row._id) }); draft.active = true; applied.push(c); continue; }
        const i = list.findIndex(r => String(r._id) === c.id);
        if (i < 0) continue;
        const row = list[i];
        if (!row.newsSource || sig(row) !== row.newsSource.sig) continue;
        if (c.type === 'update') { undo.updated.push({ list: c.list, id: c.id, before: JSON.parse(JSON.stringify(row)), afterSig: c.set?.newsSource?.sig || null }); list[i] = { ...row, ...c.set }; applied.push(c); }
        if (c.type === 'remove') { undo.removed.push({ list: c.list, index: i, row: JSON.parse(JSON.stringify(row)) }); list.splice(i, 1); applied.push(c); }
    }
    return { undo, applied };
}

// Reverses applyDraftChanges by id: added rows out, updated rows back as they were, removed rows back in place. Only a row still as this change left it is put back (an added row news triage still owns, an updated row whose sig is the one this change wrote); one changed since, by him or a later post, is kept and counted (the fresh review R1, 2026-11-05 20:14 EST: Undo put `before` over later edits, and restored `active: false` under a draft holding thirty rows, which hid it from /manage and Promote). `stats` gets how many were restored and kept.
function undoDraftChanges(draft, undo, stats = {}) {
    stats.restored = 0; stats.kept = 0;
    const owned = row => row && row.newsSource && sig(row) === row.newsSource.sig;
    for (const a of undo.added || []) {
        const list = draft[a.list] || []; const i = list.findIndex(r => String(r._id) === a.id);
        if (i < 0) continue;
        if (owned(list[i])) { list.splice(i, 1); stats.restored++; } else stats.kept++;
    }
    for (const u of undo.updated || []) {
        const list = draft[u.list] || []; const i = list.findIndex(r => String(r._id) === u.id);
        if (i < 0) continue;
        if (!u.afterSig || sig(list[i]) === u.afterSig) { list[i] = u.before; stats.restored++; } else stats.kept++;
    }
    for (const r of [...(undo.removed || [])].reverse()) { const list = (draft[r.list] = draft[r.list] || []); list.splice(Math.min(r.index, list.length), 0, r.row); stats.restored++; }
    if (undo.season) Object.assign(draft, undo.season);
    const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null) || (a && b && !isNaN(new Date(a)) && !isNaN(new Date(b)) && new Date(a).getTime() === new Date(b).getTime());
    let wasInactive = false;
    for (const s of [...(undo.seasons || [])].reverse()) {
        if (!s._before) { Object.assign(draft, s); continue; }
        if (s._before.active === false) wasInactive = true;
        for (const [k, v] of Object.entries(s._before)) { if (k === 'active') continue; if (same(draft[k], s._after?.[k])) { draft[k] = v; stats.restored++; } else stats.kept++; }
    }
    // The draft goes back to inactive only when nothing is left in it.
    if (wasInactive && !DRAW_LISTS.concat('calendar').some(l => (draft[l] || []).length) && !draft.currentSeasonTitle && !draft.bpStart) draft.active = false;
    return draft;
}

// Undo after the draft moved on (2026-11-05 15:33 EST, the pre-PR pass): a card stays 30 days and a season is about four, so an Undo can be pressed after Promote to Live emptied the draft and the next season's posts refilled it. Undo is allowed only while the draft still has the title and start this change left; otherwise the reverse is refused, because it would put last season's rows and title into the next season's draft (simulated: it wiped "Season 11 — Next" to "").
function undoAllowed(draft, after) {
    if (!after) return true;
    const t = (draft?.currentSeasonTitle || '') === (after.title || '');
    const s = (!draft?.bpStart && !after.bpStart) || (draft?.bpStart && after.bpStart && new Date(draft.bpStart).getTime() === new Date(after.bpStart).getTime());
    if (!(t && s)) return false;
    // A change made before the season had a title or start matches an emptied draft too, so it also needs one of the rows it left to still be there (the fresh review R1, 2026-11-05 20:14 EST: a cancellation's Undo after Promote to Live put last season's row into the new draft).
    if (!after.title && !after.bpStart && (after.rowIds || []).length) {
        const ids = new Set(DRAW_LISTS.concat('calendar').flatMap(l => (draft?.[l] || []).map(r => String(r._id))));
        return after.rowIds.some(id => ids.has(String(id)));
    }
    return true;
}
const afterOf = draft => ({ title: draft?.currentSeasonTitle || '', bpStart: draft?.bpStart || null, rowIds: DRAW_LISTS.concat('calendar').flatMap(l => (draft?.[l] || []).map(r => String(r._id))).slice(0, 30) });

// A /manage draft box re-parses its whole list, so every row came back new, with no _id or newsSource: news triage's Undo then found nothing (and still said Undone), and later posts treated the rows as his (the fresh review R1, 2026-11-05 20:14 EST). A line he left as it was keeps its row's id and source; a line he changed becomes his.
function keepNewsRows(prior, rows, kind) {
    const key = kind === 'calendar' ? r => [r.title, day(r.date), r.isOngoing ? 'all' : day(r.endDate), r.category || 'event'].join('|') : r => [r.title, day(r.date)].join('|');
    const pool = new Map();
    for (const p of prior || []) if (p.newsSource && sig(p) === p.newsSource.sig) pool.set(key(p), p);
    return (rows || []).map(r => { const p = pool.get(key(r)); if (!p) return r; pool.delete(key(r)); return { ...r, _id: p._id, newsSource: p.newsSource }; });
}

module.exports = { keepNewsRows, undoAllowed, afterOf, planDraftChanges, planCarryOver, applyDraftChanges, undoDraftChanges, sig, SKIP_KIND, KIND_GROUPS, DEFAULT_SKIP, skippedKind, RANK };
