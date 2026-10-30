// utils/textCommands/misfires.js -- counts text-command answers nobody wanted, per server and day (B7, his pick A, 2026-10-30 13:21 EDT). Stored in models/TextMisfire.js; read by /bot servers' checkup.
//
// ONLY DIOREO'S OWN WORDS: the command a card suggested or answered for, and the form that reached it. Never the person, never what they typed (his question "then how do we know what phrases are falsely triggering it often?", answered by A: almost every false trigger is one of our aliases or typo rules, and knowing which one is enough to fix it). What counts: a Did you mean or pick card that expired unpressed, a timestamp card (What date or time?, Couldn't read) left unanswered, and every no-match line. ⚠️ A message Dioreo stayed silent on is NOT counted, though one was agreed as "a `d ` message read as chat": the parser's silence carries nothing to key it on, and counting it would count every chat line that starts with "d ", which is the parser working. Counted in memory and written every ten minutes as one $inc per row (bot/textCommands.js's sweep), so a misfire costs no database write of its own. A restart loses at most ten minutes of counts.
const DAY_MS = 24 * 60 * 60 * 1000;
const KEEP_DAYS = 30;
const pending = new Map();

const utcDay = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const model = () => require('../../models/TextMisfire');
const clean = s => String(s || '').toLowerCase().replace(/[^a-z0-9 +/_-]/g, '').slice(0, 40);

function note(guildId, kind, word = '', via = '', now = Date.now()) {
    if (!guildId || !kind) return;
    const key = JSON.stringify([utcDay(now), guildId, kind, clean(word), clean(via)]);
    pending.set(key, (pending.get(key) || 0) + 1);
}

async function flush() {
    if (!pending.size) return 0;
    const rows = [...pending];
    pending.clear();
    const ops = rows.map(([key, n]) => {
        const [day, guildId, kind, word, via] = JSON.parse(key);
        return { updateOne: { filter: { day, guildId, kind, word, via }, update: { $inc: { count: n }, $setOnInsert: { expireAt: new Date(Date.parse(day) + (KEEP_DAYS + 1) * DAY_MS) } }, upsert: true } };
    });
    try { await model().bulkWrite(ops, { ordered: false }); } catch (err) { console.error('Text misfires: could not store the counts:', err?.message || err); }
    return ops.length;
}

// The last `days` days for one server (or every server when guildId is null), biggest first, as { kind, word, via, count }.
async function recent(guildId = null, { days = 7, limit = 5, now = Date.now() } = {}) {
    const since = utcDay(now - (days - 1) * DAY_MS);
    const match = { day: { $gte: since }, ...(guildId ? { guildId } : {}) };
    try {
        return await model().aggregate([
            { $match: match },
            { $group: { _id: { kind: '$kind', word: '$word', via: '$via' }, count: { $sum: '$count' } } },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]).then(rows => rows.map(r => ({ ...r._id, count: r.count })));
    } catch (err) {
        console.error('Text misfires: could not read:', err?.message || err);
        return null;
    }
}

const KIND_LABEL = { didYouMean: 'Did you mean ignored', pick: 'Pick ignored', askedForInput: 'Card unanswered', couldntRead: "Couldn't read, ignored", noMatch: 'No match' };
const line = r => `${KIND_LABEL[r.kind] || r.kind} · \`${r.word || '—'}\`${r.via ? ` via \`${r.via}\`` : ''} · **${r.count}**`;

module.exports = { note, flush, recent, line, KIND_LABEL, __pending: pending };
