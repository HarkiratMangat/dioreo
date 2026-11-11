// ==========================================
// /manage draws — the rehauled panel: routing, permission checks, saves
// ==========================================
// Built 2026-11-07 19:15 EST from the /mockdraws mock-up, on his word (2026-11-07 19:11 EST): "i'm leaving it under your design critique and judgement. just let me know once everything is done and you need to merge". The same shape as the gunsmith panel (handlers/manage/gunsmith/, v3.13.0).
//
// ⚠️ SAVES GO THROUGH THE EXISTING CODE. Quick Add opens the real pop-up; Add New / Add Returning hand their pop-up to handlers/manage/draws.js addDraw, and Edit to editDraw, both QUIET (2026-11-10 10:59 EST): the saver returns what it saved and the panel shows it on the draw's card with Revert, instead of a second message below (the follow-up is still what every other caller gets). Paste and Edit N save through bulkAddOrReplaceDraws (Replace: an existing title is updated, a new one added) with only the lines that change something, quiet too; Delete uses deleteDraw; Delete N commits draw.bulkDelete; Purge uses purgeDraws. End Date writes the draw's /calendar row with calendar.edit or calendar.add, in the shape Quick Add writes it (planEnd). Move is draw.delete and draw.add in ONE commit, so one Revert puts it back.
//
// ⚠️ PERMISSIONS: the router's /manage lock runs first (`mng_`); every action here also runs utils/manageActions.js resolveAction for its own tier before it opens a pop-up or writes, and a delete or purge re-checks the destructive tier. core/changeset.js commitSet checks every op once more (an end date needs the Calendar tier there, and its refusal is shown on the card).
//
// ⚠️ THE CRASH NET IS THE ROUTER'S. Nothing here catches to swallow; error-branch replies are awaited.

const emojis = require('../../../utils/emojiMap');
const { sendV2Payload } = require('../../../utils/sendV2Payload');
const V = require('./views');

const PREFIX = 'mng_dr|';
const manageCommand = () => require('../../../commands/manage');
const drawsSave = () => require('../draws');
const ManageSelection = () => require('../../../models/ManageSelection');
const getDoc = () => require('../../../models/SeasonalData').findOne({ docType: 'global' }).lean();

// ---------- answering ----------
async function show(interaction, components, { ephemeral = true } = {}) {
    if (!interaction.deferred && !interaction.replied) {
        if (interaction.isChatInputCommand?.() || (interaction.isModalSubmit?.() && !interaction.message)) await interaction.deferReply({ flags: ephemeral ? 64 : 0 });
        else await interaction.deferUpdate();
    }
    return sendV2Payload(interaction, components, { skipExpiry: true });
}
async function say(interaction, content) {
    try {
        if (interaction.deferred || interaction.replied) await interaction.followUp({ content, flags: 64 });
        else await interaction.reply({ content, flags: 64 });
    } catch (e) { console.error('manage draws: could not answer (interaction likely expired):', e.message); }
}
// A pop-up's submit answers on the message it was opened from; from the slash command there is none, so it answers in a new private one.
const deferSubmit = (interaction) => (interaction.message ? interaction.deferUpdate() : interaction.deferReply({ flags: 64 }));

// ---------- permission per action ----------
async function gate(interaction, action) {
    const { resolveAction, DENIAL_MESSAGE } = require('../../../utils/manageActions');
    const g = await resolveAction('draws', action, interaction.user.id);
    if (g.ok) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, g.message || DENIAL_MESSAGE[g.reason] || `${emojis.accessDenied} You do not have access to that.`);
    return false;
}
// End Date and "+ Calendar Row(s)" write /calendar rows, and commitSet refuses the WHOLE save without the Calendar tier for that op (core/changeset.js checkOps). Asked before the pop-up opens or the button is drawn, so an admin with Draws access only is told up front, not after typing a date (2026-11-10 13:20 EST, the "are you sure?" pass: the panel gated these on the draws tier alone).
async function calendarAllowed(userId, ops) {
    return (await require('../../../core/changeset').checkOps(userId, ops.filter(Boolean))).ok;
}
// The ops an End Date could write for this draw: an edit of its row, or a new row. Two different choices, so at least one differs from what the row holds now.
const endProbe = (d) => (d ? [planEnd(d, { choice: 'season' }), planEnd(d, { choice: 'tbd' })] : []);
async function calendarGate(interaction, ops) {
    if (await calendarAllowed(interaction.user.id, ops)) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, `${emojis.accessDenied} **A draw's end date lives on its /calendar row, and you don't have access to change /calendar.** Nothing was changed.`);
    return false;
}
async function gateDestructive(interaction) {
    const { can } = require('../../../utils/adminAccess');
    if (await can(interaction.user.id, 'manage.draws', 'destructive')) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, `${emojis.accessDenied} **You don't have access to delete draws anymore.** Nothing was deleted.`);
    return false;
}

// ---------- the selection store (models/ManageSelection.js, mode DRAWS) ---------- Select's list, Search's results, a Check's paste, and Paste / Edit N's text.
const newToken = () => require('crypto').randomBytes(6).toString('base64url');
async function createSelection(data = {}) { const token = newToken(); await ManageSelection().create({ _id: token, mode: 'DRAWS', ...data }); return token; }
async function loadSel(token) { const s = token ? await ManageSelection().findById(token).lean() : null; return s && s.mode === 'DRAWS' ? s : null; }
const setSel = (token, fields) => ManageSelection().updateOne({ _id: token }, { $set: fields });

const selectedKeys = (sel) => { const on = new Set(sel.selected); return sel.ids.filter(k => on.has(k)); };
// Paste / Edit N keep both boxes' text as JSON in the selection's `text`.
const packText = (newText, retText) => JSON.stringify({ newText: newText || '', retText: retText || '' });
const unpackText = (s) => { try { const j = JSON.parse(s || '{}'); return { newText: j.newText || '', retText: j.retText || '' }; } catch { return { newText: '', retText: '' }; } };

// ---------- home ----------
async function home(doc, note = null, interaction = null, { noteRow = null } = {}) {
    const showEmojis = interaction ? require('../../../utils/owner').isOwnerId(interaction.user.id) : false;
    return V.pageView(doc || await getDoc(), note, { pageRow: manageCommand().buildPageSelectRow('draws', { showEmojis }), noteRow });
}
async function renderHome(interaction) { return show(interaction, await home(await getDoc(), null, interaction)); }

// A card from wherever it was opened: `back` `t:<token>` is a search's results, which the card walks.
async function cardFor(doc, key, back, opts = {}) {
    const sel = /^t:/.test(String(back || '')) ? await loadSel(String(back).slice(2)) : null;
    return V.cardView(doc, key, { ...opts, back: sel || !/^t:/.test(String(back || '')) ? back : null, sel });
}
// A miss or an error answers in its own private message and leaves the panel as it was (2026-11-11 11:02 EST, his ask: "i don't want confirmations/errors inside of the panel itself ... They should be new private messages"). `say` replies privately, or follows up when the click was already acknowledged.
const GONE = `${emojis.cross} That draw no longer exists. Open \`/manage draws\` again for the current list.`;
const EXPIRED = `${emojis.cross} That list expired (lists last a day). Select again.`;

// ---------- finding draws ---------- Titles typed (each line or comma part: every word must be in the title) are ADDED; the quick picks read like /draws' own filter (2026-11-10 10:59 EST): picks in one group widen (New or Returning; Ended or Leaving Soon), and the groups narrow each other (New + Ended = the New draws that ended). A single pick is the list it names, as before.
function resolveKeys(doc, names, picks = []) {
    const all = V.allDraws(doc);
    const keys = new Set();
    const valid = (picks || []).filter(p => V.STATUS[p]);
    if (valid.length) {
        const groups = {};
        for (const p of valid) (groups[V.STATUS[p].group] ||= []).push(p);
        all.filter(d => Object.values(groups).every(g => g.some(p => V.STATUS[p].test(d)))).forEach(d => keys.add(d._key));
    }
    const unmatched = [];
    for (const line of String(names || '').split(/\n|,/).map(x => x.trim()).filter(Boolean)) {
        const words = line.toLowerCase().split(/\s+/);
        const hits = all.filter(d => words.every(w => d.title.toLowerCase().includes(w)));
        if (!hits.length) unmatched.push(line);
        hits.forEach(d => keys.add(d._key));
    }
    return { keys: [...keys], unmatched };
}
// How the quick picks read as one phrase, for the Select panel's subtitle: "New Draws that are Ended or Leaving Soon".
function picksLabel(picks = []) {
    const valid = (picks || []).filter(p => V.STATUS[p]);
    const of = (g) => valid.filter(p => V.STATUS[p].group === g).map(p => V.STATUS[p].label);
    const sections = of('section'), states = of('state');
    if (!valid.length) return null;
    return `${sections.join(' or ') || 'Draws'}${states.length ? ` that are ${states.join(' or ')}` : ''}`;
}
// Search (2026-11-10 11:19 EST): every word in the title OR an item's name, so "kestrel" finds the draw that has it; title matches first.
function searchKeys(doc, q) {
    const words = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const all = V.allDraws(doc);
    const inTitle = (d) => words.every(w => d.title.toLowerCase().includes(w));
    const inAny = (d) => { const hay = `${d.title} ${(d.items || []).map(i => i.name).join(' ')}`.toLowerCase(); return words.every(w => hay.includes(w)); };
    return [...all.filter(inTitle), ...all.filter(d => !inTitle(d) && inAny(d))].map(d => d._key);
}
const field = (i, id) => { try { const f = i.fields.getField(id); return f?.value ?? f?.values ?? null; } catch { return null; } };

// ---------- paste text ---------- What pasted or edited draw lines would do, line by line against the draws saved now, matched the way Replace Multiple saves them (utils/bulkMerge.js upsertByTitle: the same title, else the best fuzzy match). `keepNew` / `keepRet` are the lines that add or change something, which is all Save sends, so an Edit N left as it was saves nothing.
function matchStored(stored, title) {
    const { bestDrawMatch, fuzzyMatch } = require('../../../utils/search');
    const norm = (t) => String(t || '').trim().toLowerCase();
    return stored.find(s => norm(s.title) === norm(title)) || bestDrawMatch(stored, title, x => x.title, (itemTitle, t) => fuzzyMatch(t, itemTitle));
}
function previewDraws(doc, newText, retText) {
    const { parseBulkDrawList } = require('../../../utils/adminParser');
    const out = { added: [], changed: [], same: [], keepNew: [], keepRet: [], skipped: [], twins: [] };
    // A pasted line carries a day, never a time (Add Multiple reads dates as UTC midnight), so dates are compared by their UTC day.
    const day = (x) => (x ? new Date(x).toISOString().slice(0, 10) : '');
    for (const [sec, raw] of [['new', newText], ['returning', retText]]) {
        const stored = doc[sec === 'new' ? 'newDraws' : 'returningDraws'] || [];
        const keep = sec === 'new' ? out.keepNew : out.keepRet;
        for (const line of String(raw || '').split('\n').map(x => x.trim()).filter(Boolean)) {
            const [p] = parseBulkDrawList(line);
            if (!p) { out.skipped.push(line.slice(0, 80)); keep.push(line); continue; }
            const old = matchStored(stored, p.title);
            const label = `${sec === 'new' ? emojis.newDraws : emojis.returningDraws} ${p.title}`;
            // A new line whose title the OTHER list holds would put the draw in both (2026-11-10 15:50 EST): left out of the save, and said.
            if (!old) {
                const otherKey = sec === 'new' ? 'returningDraws' : 'newDraws';
                const twin = (doc[otherKey] || []).find(x => require('../../../utils/search').isSameDrawTitle(x.title, p.title));
                if (twin) { out.twins.push(`${label} · already in ${sec === 'new' ? 'Returning' : 'New'} Draws`); continue; }
                out.added.push(label); keep.push(line); continue;
            }
            const diff = [];
            if (old.title !== p.title) diff.push('title');
            if (day(old.date) !== day(p.date)) diff.push('date');
            // Which items changed, not just "items" (2026-11-10 11:23 EST): an Edit N left as it was flagged a draw whose stored names break the title-case rule ("Herrscher Of Thunder"), and only naming the item says why.
            const oldKeys = (old.items || []).map(i => `${i.tier}|${i.name}`), newKeys = (p.items || []).map(i => `${i.tier}|${i.name}`);
            if (oldKeys.join(';') !== newKeys.join(';')) {
                const cut = (x) => String(x).slice(0, 40);
                const named = [...(old.items || []).filter(i => !newKeys.includes(`${i.tier}|${i.name}`)).map(i => `−${cut(i.name)}`), ...(p.items || []).filter(i => !oldKeys.includes(`${i.tier}|${i.name}`)).map(i => `+${cut(i.name)}`)];
                diff.push(named.length ? `items: ${named.slice(0, 4).join(', ')}${named.length > 4 ? ', …' : ''}` : 'items (order)');
            }
            if (p.thumbnailUrl && p.thumbnailUrl !== old.thumbnailUrl) diff.push('picture');
            if (p.priceType && p.priceType !== (old.priceType || '')) diff.push('draw type');
            if (p.endDate) {
                const calRow = require('../../../utils/drawEndReminder').calendarRowFor(doc, old.title);
                if (!calRow?.endDate || day(calRow.endDate) !== day(p.endDate)) diff.push('end date');
            }
            if (diff.length) { out.changed.push(`${label} · *${diff.join(', ')}*`); keep.push(line); } else out.same.push(p.title);
        }
    }
    const cap = (list, max = 20) => (list.length > max ? [...list.slice(0, max), `-# …and ${list.length - max} more`] : list);
    const parts = [];
    if (out.added.length) parts.push(`${emojis.mngAdd} **Added · ${out.added.length}**`, ...cap(out.added.map(x => `- ${x}`)), '');
    if (out.changed.length) parts.push(`${emojis.mngBulkReplace} **Changed · ${out.changed.length}**`, ...cap(out.changed.map(x => `- ${x}`)), '');
    if (out.same.length) parts.push(`-# Unchanged · ${out.same.length}: ${out.same.join(', ').slice(0, 700)}`, '');
    if (out.twins.length) parts.push(`${emojis.warn} **Left out · ${out.twins.length}**`, ...cap(out.twins.map(x => `- ${x}`), 8), '-# A draw is New or Returning, not both. Move it from its card, or delete one first.', '');
    if (out.skipped.length) parts.push(`${emojis.warn} **Not read · ${out.skipped.length}**`, ...cap(out.skipped.map(x => `- \`${x}\``), 8), '-# A line needs a title, at least one item and a date, split by commas.', '');
    parts.push('-# Nothing is saved until you press Save.');
    return { ...out, parts, count: out.added.length + out.changed.length, total: out.added.length + out.changed.length + out.same.length };
}
// A line with no picture link keeps the stored draw's picture (2026-11-10 11:19 EST): Edit N's box leaves the links out so each line is half as long, and a Paste of an existing draw without a link no longer asks Cloudinary for a near match. The stored link is put back on the line before it saves, so nothing downstream changes.
function withStoredLinks(doc, lines, sec) {
    const { parseBulkDrawList } = require('../../../utils/adminParser');
    const stored = doc[sec === 'new' ? 'newDraws' : 'returningDraws'] || [];
    return lines.map(line => {
        const [p] = parseBulkDrawList(line);
        if (!p || p.thumbnailUrl) return line;
        const old = matchStored(stored, p.title);
        return old?.thumbnailUrl ? `${line}, ${old.thumbnailUrl}` : line;
    });
}

function fill(modal, values) {
    const json = modal.toJSON ? modal.toJSON() : JSON.parse(JSON.stringify(modal));
    for (const r of json.components || []) for (const c of [...(r.components || []), ...(r.component ? [r.component] : [])]) if (values[c.custom_id] !== undefined) c.value = String(values[c.custom_id]).slice(0, c.max_length || 4000);
    return json;
}
const reId = (modal, customId, title) => { const j = modal.toJSON ? modal.toJSON() : JSON.parse(JSON.stringify(modal)); j.custom_id = customId; if (title) j.title = title.slice(0, 45); return j; };

async function previewPanel(token, newText, retText, { isEdit }) {
    const doc = await getDoc();
    const pv = previewDraws(doc, newText, retText);
    return V.resultView({
        ok: pv.skipped.length ? 'warn' : true, crumbs: isEdit ? ['Select Draws', 'Edit'] : ['Paste'],
        title: `${isEdit ? 'Edit' : 'Paste'} preview · ${pv.count} of ${pv.total} to save`, body: pv.parts,
        back: isEdit ? ['tedit', token, 0, 'again'] : ['paste', token], backLabel: isEdit ? 'Edit Again' : 'Edit Paste',
        extraButtons: pv.count ? [V.btn(['save', token], `Save ${pv.count}`, emojis.checkmark, 3)] : [],
        extraRows: isEdit ? [V.row(V.btn(['slist', token, 0], 'Back to List', emojis.returnArrow))] : [],
    });
}

// The draws a revert put back, found by title. Reverting a delete re-adds each draw with a NEW id (core/ops/draws.js mints one on every add, single or bulk), so the old keys find nothing. A delete or a move's change row names its draw in `target`; a bulk delete's names them in its stored inverse (the removed draws). Only delete rows are read: an edit's inverse holds a whole section, which would match every draw in it. Change ids arrive as `#742`; the store may hold them with or without the mark.
async function restoredKeys(doc, changeIds) {
    const ids = changeIds.flatMap(id => [id, String(id).replace(/^#/, ''), `#${String(id).replace(/^#/, '')}`]);
    const rows = await require('../../../models/ChangeLog').find({ changeId: { $in: [...new Set(ids)] }, model: 'SeasonalData', action: { $in: ['delete', 'bulkDelete'] } }).select('target action inverse').lean();
    const titles = new Set();
    for (const r of rows) {
        if (r.action === 'delete' && r.target) titles.add(String(r.target));
        for (const op of [r.inverse].flat(3)) for (const p of op?.payload?.parsed || []) if (p?.title) titles.add(p.title);
    }
    return V.allDraws(doc).filter(d => titles.has(d.title)).map(d => d._key);
}
const restoredKey = async (doc, changeIds) => (await restoredKeys(doc, changeIds))[0] || null;
// Where an Edit or End Date opened from a list lands (`L`): back on that list, or on the search results it came from (2026-11-11 11:02 EST: every list edits in place now, not only Needs a Look).
async function listBack(doc, back, note, noteRow = null) {
    if (/^t:/.test(String(back || ''))) {
        const tok = String(back).slice(2);
        const sel = await loadSel(tok);
        if (sel) return V.searchView(doc, tok, sel, 0, { note, noteRow });
    }
    return V.listView(doc, V.STATUS[back] ? back : 'look', 0, { note, noteRow });
}
// ---------- Revert ---------- The panel's own Revert, so it lands back where the save was made (results.js revertChanges does the reverting and its permission check). `key` and `back` name the draw's card: the card if the draw is still there after the revert, else the list it came from, else Home. A Revert past Discord's 100 characters is left off, and the result says where to revert instead.
function revertButton(changeIds, key = '', back = '') {
    const id = [`${PREFIX}revert`, (changeIds || []).join(','), key, back].join('|').replace(/\|+$/, '');
    return changeIds?.length && id.length <= 100 ? [{ type: 2, style: 4, label: 'Revert', custom_id: id, emoji: emojis.parseEmoji(emojis.keep) }] : [];
}
const revertRow = (changeIds, key, back) => { const b = revertButton(changeIds, key, back); return b.length ? V.row(...b) : null; };
const revertHint = (changeIds, key, back) => (changeIds?.length && !revertButton(changeIds, key, back).length ? `\n-# Too many changes for one Revert button: revert them from \`/bot analytics\` › Changes.` : '');

// ---------- what a save says ----------
function savedHeader(result) {
    const { drawChanges } = require('../../../utils/managePanels');
    const changes = drawChanges(result.before, result.draw);
    if (result.endChanged) changes.push(`**Ends:** ${result.beforeEnd ? `~~${V.stamp(new Date(result.beforeEnd))}~~ → ` : ''}${result.endDate ? V.stamp(new Date(result.endDate)) : '*no end date*'}`);
    return [`### ${emojis.checkmark} Saved`, ...changes.map(c => `- ${c}`), ...(result.notes || []).filter(Boolean).map(n => `-# ${n}`), ...(result.warnings || []).map(w => `${emojis.warn} ${w}`)].join('\n').slice(0, 1800);
}
const askKinds = (interaction, titles) => require('../itemKinds').askItemKinds(interaction, titles || []);

// ---------- the draw pop-ups ----------
async function editModal(doc, key, customId) {
    const d = V.allDraws(doc).find(x => x._key === key);
    if (!d) return null;
    return reId(manageCommand().buildEditDrawModal(d, String(d._id), d._sec, V.rowFor(doc)(d)), customId, `Edit ${d.title}`);
}
function endModalFor(doc, key, back = '', ret = '') {
    const d = V.allDraws(doc).find(x => x._key === key);
    if (!d) return null;
    return V.endModal(V.ID('endm', key, back, ret), { title: d.title, row: d._row });
}
// What the End Date pop-up asks for: { choice, endDate, error, note }. `d` is the draw (its start bounds the end); `row` is its calendar row (to tell a typed date from the one the box was opened with).
function readEnd(interaction, d = null) {
    const { readChoice } = require('../../../utils/formChoice');
    const { parseAdminEndDate, formatAdminDate } = require('../../../utils/adminParser');
    let choice = 'date';
    try { choice = readChoice(interaction, 'when')[0] || 'date'; } catch { choice = 'date'; }
    const typed = String(field(interaction, 'date') || '').trim();
    if (choice !== 'date') {
        const opened = d?._row?.endDate ? formatAdminDate(new Date(d._row.endDate)) : '';
        const note = typed && typed !== opened ? `-# The date box was left out: ${choice === 'season' ? 'With the season' : 'Not announced yet'} was picked.` : null;
        return { choice, endDate: null, note };
    }
    if (!typed) return { error: 'Type an end date, or pick With the season or Not announced yet.' };
    const endDate = parseAdminEndDate(typed);
    if (!endDate) return { error: `Couldn't read "${typed.slice(0, 40)}" as a date.` };
    if (d && Number.isFinite(d.startMs) && endDate.getTime() <= d.startMs) return { error: `That end is not after the draw's start (${V.stamp(d.startMs)}).` };
    return { choice, endDate, note: null };
}
// The calendar op for an end date, or null when the row already reads that way. A row keeps its own title, start and Double CP (an event added ahead of the draw may carry its own start); a draw with no row gets one, titled as the draw and starting with it.
function planEnd(d, { choice, endDate }) {
    const want = choice === 'season' ? { endDate: null, isOngoing: true } : choice === 'tbd' ? { endDate: null, isOngoing: false } : { endDate, isOngoing: false };
    const calRow = d._row;
    if (calRow) {
        const same = (calRow.endDate ? new Date(calRow.endDate).getTime() : 0) === (want.endDate ? want.endDate.getTime() : 0) && Boolean(calRow.isOngoing) === want.isOngoing;
        if (same) return null;
        // The row's own start (an event added ahead of the draw may carry its own); a row with none takes the draw's, never `new Date(null)`, which is 1970.
        const rowStart = calRow.date ? new Date(calRow.date) : d.date ? new Date(d.date) : new Date(new Date().toISOString().slice(0, 10));
        return { type: 'calendar.edit', target: { elementId: String(calRow._id) }, payload: { title: calRow.title, date: rowStart, ...want, category: 'draw', isDoubleCP: Boolean(calRow.isDoubleCP) } };
    }
    const start = d.date ? new Date(d.date) : new Date(new Date().toISOString().slice(0, 10));
    return { type: 'calendar.add', payload: { title: d.title, date: start, ...want, category: 'draw', isDoubleCP: false } };
}
const endWords = (calRow) => (!calRow ? 'no end date' : calRow.isOngoing ? 'with the season' : calRow.endDate ? V.stamp(new Date(calRow.endDate)) : 'TBD');
const wantWords = ({ choice, endDate }) => (choice === 'season' ? 'with the season' : choice === 'tbd' ? 'TBD' : V.stamp(endDate));

async function confirmCard(doc, kind, key, back = '', userId = null) {
    const d = V.allDraws(doc).find(x => x._key === key);
    if (!d) return home(doc, `${emojis.cross} That draw no longer exists.`);
    const to = d._sec === 'new' ? 'Returning' : 'New';
    // The other list already holding this title: said on the question itself, with no Yes, instead of after it (2026-11-10 15:50 EST, click test).
    if (kind === 'move') {
        const { isSameDrawTitle } = require('../../../utils/search');
        const twin = (doc[d._sec === 'new' ? 'returningDraws' : 'newDraws'] || []).find(x => isSameDrawTitle(x.title, d.title));
        if (twin) return cardFor(doc, key, back, { header: `-# ${emojis.cross} ${to} Draws already has **${twin.title}**, so this one can't move there. Delete one of the two first.` });
    }
    // "+ Calendar Row" only for someone who may delete /calendar rows; otherwise the whole delete would be refused.
    const rowOk = Boolean(d._row) && kind !== 'move' && await calendarAllowed(userId, [{ type: 'calendar.delete', target: { elementId: String(d._row._id) } }]);
    const q = kind === 'move'
        ? `### ${emojis.warn} Move ${d.title} to ${to} Draws?\n-# Its items, picture, draw type and end date go with it.`
        : `### ${emojis.warn} Delete ${d.title}?\n-# ${rowOk ? '**Yes, Delete** keeps its /calendar row; **Delete + Calendar Row** removes that too.' : d._row ? 'Its /calendar row stays.' : 'It has no /calendar row.'} Every change can be reverted.`;
    const buttons = kind === 'move'
        ? [V.btn(['moveok', key, back], 'Yes, Move', emojis.checkmark, 3)]
        : [V.btn(['delok', key, back], 'Yes, Delete', emojis.deleteBin, 4), ...(rowOk ? [V.btn(['delok', key, back, 'r'], 'Delete + Calendar Row', emojis.calendar, 4)] : [])];
    return cardFor(doc, key, back, { header: q, extra: [V.row(...buttons, V.btn(['card', key, back], 'Cancel', emojis.returnArrow))] });
}

// ---------- the slash command ---------- `draw:` opens a draw (autocomplete), `show:` a list, `do:` an action (with a draw, at once). A pop-up has to be the first answer, so every path that opens one runs before anything is deferred.
async function openFromSlash(interaction) {
    const o = interaction.options;
    const drawValue = o.getString('draw'), act = o.getString('do'), list = o.getString('show');
    const ephemeral = o.getString('visibility') !== 'public';
    const view = (components) => show(interaction, components, { ephemeral });
    const m = manageCommand();
    if (act === 'quickadd') return (await gate(interaction, 'quickadd')) && interaction.showModal(m.buildQuickAddModal());
    if (act === 'addnew' || act === 'addreturning') return (await gate(interaction, act)) && interaction.showModal(reId(m.buildAddDrawModal(act === 'addnew' ? 'new' : 'returning'), V.ID('addm', act === 'addnew' ? 'new' : 'returning')));
    if (act === 'paste') return (await gate(interaction, 'bulkadd')) && interaction.showModal(reId(m.buildBulkBothDrawsModal('add'), V.ID('pastem'), 'Paste Draws'));
    if (act === 'export') return (await gate(interaction, 'exportnew')) && interaction.showModal(V.exportModal());
    if (act === 'check') return (await gate(interaction, 'exportnew')) && interaction.showModal(V.checkModal());
    if (act === 'guide') return runGuide(interaction);
    const doc = await getDoc();
    if (drawValue) {
        let key = drawValue;
        if (!V.allDraws(doc).some(d => d._key === key)) {
            const keys = searchKeys(doc, drawValue);
            if (keys.length !== 1) return say(interaction, `${emojis.cross} ${keys.length ? `${keys.length} draws match` : 'No draw matches'} \`${drawValue.slice(0, 60)}\`. Pick one from the list, or type more of its title.`);
            key = keys[0];
        }
        if (act === 'edit') return (await gate(interaction, 'edit')) && interaction.showModal(await editModal(doc, key, V.ID('editm', key)));
        if (act === 'end') return (await gate(interaction, 'edit')) && (await calendarGate(interaction, endProbe(V.allDraws(doc).find(x => x._key === key)))) && interaction.showModal(endModalFor(doc, key));
        if (act === 'move') return (await gate(interaction, 'edit')) && view(await confirmCard(doc, 'move', key, '', interaction.user.id));
        if (act === 'delete') return (await gate(interaction, 'delete')) && view(await confirmCard(doc, 'del', key, '', interaction.user.id));
        return view(V.cardView(doc, key));
    }
    if (list) return view(V.listView(doc, list));
    if (act) return view(await home(doc, `${emojis.warn} That needs a \`draw:\` to act on.`, interaction));
    return view(await home(doc, null, interaction));
}

async function runGuide(interaction) {
    if (!(await gate(interaction, 'formatguide'))) return;
    const action = require('../../../utils/manageActions').ACTIONS_BY_PAGE.draws.find(x => x.id === 'formatguide');
    return action.run({ interaction, page: 'draws', manageCommand: manageCommand() });
}

// `draw:` suggestions (2026-11-10 11:19 EST): every word in the title or an item's name; title matches first, then what is running, then what is coming, then what ended; each with its section and state, so two similar titles are told apart.
async function autocomplete(interaction) {
    const q = String(interaction.options.getFocused() || '').toLowerCase();
    const doc = await getDoc();
    const words = q.split(/\s+/).filter(Boolean);
    const hay = (d) => `${d.title} ${(d.items || []).map(i => i.name).join(' ')}`.toLowerCase();
    const rank = (d) => (d.bits & 8 ? 0 : d.bits & 4 ? 1 : 2);
    const inTitle = (d) => words.every(w => d.title.toLowerCase().includes(w));
    const hits = V.allDraws(doc).filter(d => words.every(w => hay(d).includes(w)))
        .sort((a, b) => Number(inTitle(b)) - Number(inTitle(a)) || rank(a) - rank(b) || (b.startMs || 0) - (a.startMs || 0)).slice(0, 25);
    return interaction.respond(hits.map(d => ({ name: `${d.title} · ${V.secWord(d)} · ${V.stateName(d)}`.slice(0, 100), value: d._key })));
}

// ---------- routing ----------
async function route(interaction) {
    const [, verb, a, b, c] = interaction.customId.split('|');
    // The Draw Index panel's own verbs (`ix…`, handlers/manage/drawsPanel/drawIndex.js), answered with this panel's helpers (2026-11-11 11:02 EST).
    const IX = require('./drawIndex');
    if (IX.isIndexVerb(verb)) return IX.route(interaction, verb, a, b, c, { show, say, gate, getDoc, createSelection, loadSel });
    const m = manageCommand();
    const n = (x) => Number(x) || 0;

    // ----- pop-ups first (a pop-up has to be the first answer) -----
    if (verb === 'find') return interaction.showModal(V.searchModal());
    if (verb === 'select') return interaction.showModal(V.selectModal());
    if (verb === 'export') return (await gate(interaction, 'exportnew')) && interaction.showModal(V.exportModal());
    // Check Draw Index reads, never writes: Export's read tier gates it. `a` is the token of the last check, so Check Again opens with what was pasted.
    if (verb === 'check') {
        if (!(await gate(interaction, 'exportnew'))) return;
        const last = a ? await loadSel(a) : null;
        return interaction.showModal(V.checkModal(last?.text || '', last ? a : null));
    }
    if (verb === 'qathese') {
        if (!(await gate(interaction, 'quickadd'))) return;
        const last = await loadSel(a);
        return interaction.showModal(m.buildQuickAddModal({ value: (last?.query || []).slice(0, 10).join('\n') }));
    }
    if (verb === 'guide') return runGuide(interaction);
    if (verb === 'quickadd') return (await gate(interaction, 'quickadd')) && interaction.showModal(m.buildQuickAddModal());
    if (verb === 'addnew' || verb === 'addreturning') return (await gate(interaction, verb)) && interaction.showModal(reId(m.buildAddDrawModal(verb === 'addnew' ? 'new' : 'returning'), V.ID('addm', verb === 'addnew' ? 'new' : 'returning')));
    if (verb === 'paste') {
        if (!(await gate(interaction, 'bulkadd'))) return;
        const last = a ? await loadSel(a) : null;
        const { newText, retText } = unpackText(last?.text);
        return interaction.showModal(fill(reId(m.buildBulkBothDrawsModal('add'), V.ID('pastem'), 'Paste Draws'), { new_text: newText, returning_text: retText }));
    }
    // Edit and End Date carry the card's origin (`b`) and `c` = `L` when opened from Needs a Look, so the submit lands back there.
    if (verb === 'edit' || verb === 'end') {
        if (!(await gate(interaction, 'edit'))) return;
        const doc = await getDoc();
        if (verb === 'end' && !(await calendarGate(interaction, endProbe(V.allDraws(doc).find(x => x._key === a))))) return;
        const modal = verb === 'edit' ? await editModal(doc, a, V.ID('editm', a, b, c)) : endModalFor(doc, a, b, c);
        return modal ? interaction.showModal(modal) : say(interaction, GONE);
    }
    if (verb === 'tend') {
        if (!(await gate(interaction, 'edit'))) return;
        const sel = await loadSel(a);
        if (!sel) return say(interaction, EXPIRED);
        const keys = selectedKeys(sel);
        const doc = await getDoc();
        if (!keys.length) return show(interaction, V.selectView(doc, a, sel, null, n(b)));
        const picked = V.allDraws(doc).filter(d => keys.includes(d._key));
        if (!(await calendarGate(interaction, [picked.find(d => d._row), picked.find(d => !d._row)].flatMap(endProbe)))) return;
        return interaction.showModal(V.endModal(V.ID('tendm', a), { count: keys.length }));
    }

    // ----- views -----
    if (verb === 'page') return renderHome(interaction);
    if (verb === 'revert') {
        return require('../results').revertChanges(interaction, String(a || '').split(',').filter(Boolean), {
            doneNote: 'it is back as it was',
            render: async (note) => {
                const doc = await getDoc();
                const card = b ? await cardFor(doc, b, c, { header: note }) : null;
                if (card) return card;
                // Reverting a Move or a Delete re-adds the draw with a NEW id (core/ops/draws.js mints one on every add), so its old key finds nothing. Its title is on the change rows, so the Revert still lands on the draw's card (2026-11-10 13:22 EST: a Move's Revert landed on the New Draws list).
                if (b || c === 'new' || c === 'returning') {
                    const key = await restoredKey(doc, String(a || '').split(',').filter(Boolean));
                    const back = V.STATUS[c] && c !== 'new' && c !== 'returning' ? c : '';
                    const again = key ? await cardFor(doc, key, back, { header: note }) : null;
                    if (again) return again;
                }
                // `s:<token>`: a Select list's action, so the Revert lands back on that list (2026-11-10 11:23 EST).
                if (/^s:/.test(String(c || ''))) {
                    const tok = String(c).slice(2);
                    const sel = await loadSel(tok);
                    if (sel) {
                        // A reverted Delete N: the draws are back under new ids, so they rejoin the list (2026-11-10 13:27 EST: the list said "No draws found").
                        const back = (await restoredKeys(doc, String(a || '').split(',').filter(Boolean))).filter(k => !sel.ids.includes(k));
                        if (back.length) { sel.ids = [...sel.ids, ...back]; await setSel(tok, { ids: sel.ids }); }
                        return V.selectView(doc, tok, sel, note);
                    }
                }
                return V.STATUS[c] ? V.listView(doc, c, 0, { note }) : home(doc, note, interaction);
            },
        });
    }
    if (verb === 'browse' && interaction.isStringSelectMenu?.()) return show(interaction, V.listView(await getDoc(), interaction.values[0]));
    if (verb === 'list') return show(interaction, V.listView(await getDoc(), a, n(b)));
    if (verb === 'sres') {
        const sel = await loadSel(a);
        return show(interaction, sel ? V.searchView(await getDoc(), a, sel, n(b)) : V.resultView({ title: 'Those search results expired. Search again.', ok: false, back: 'find', backLabel: 'Search Again' }));
    }
    if (verb === 'open' && interaction.isStringSelectMenu?.()) {
        const doc = await getDoc();
        const card = await cardFor(doc, interaction.values[0], a);
        return card ? show(interaction, card) : say(interaction, GONE);
    }
    if (verb === 'card') {
        const doc = await getDoc();
        // `b` is where the card came from, which its arrows walk; a card opened from elsewhere walks its section.
        const card = await cardFor(doc, a, b);
        return card ? show(interaction, card) : say(interaction, GONE);
    }

    // ----- one draw -----
    if (verb === 'addm' && interaction.isModalSubmit?.()) {
        const sec = a === 'returning' ? 'returning' : 'new';
        if (!(await gate(interaction, sec === 'new' ? 'addnew' : 'addreturning'))) return;
        await deferSubmit(interaction);
        const result = await drawsSave().addDraw(interaction, { customId: `add_draw_${sec}`, quiet: true });
        const doc = await getDoc();
        // The saver's own Try Again message says why; the panel stays as it was.
        if (!result?.ok) return;
        const key = `${sec[0]}:${result.draw._id}`;
        const header = [`### ${emojis.checkmark} Added to ${sec === 'new' ? 'New' : 'Returning'} Draws`, ...(result.notes || []).filter(Boolean).map(x => `-# ${x}`), ...(result.warnings || []).map(w => `${emojis.warn} ${w}`)].join('\n') + revertHint(result.changeIds, key, sec);
        await show(interaction, V.cardView(doc, key, { back: sec, header, resultRow: revertRow(result.changeIds, key, sec) }) || await home(doc, null, interaction));
        return askKinds(interaction, result.titles);
    }
    if (verb === 'editm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, 'edit'))) return;
        const { section, id } = V.splitKey(a);
        await deferSubmit(interaction);
        const result = await drawsSave().editDraw(interaction, { customId: `edit_draw_${id}_${section}`, quiet: true });
        const doc = await getDoc();
        if (result?.gone) return say(interaction, GONE);
        // Nothing changed, or the save failed (its Try Again message says why): a private note, and the panel stays as it was.
        if (result?.unchanged) return say(interaction, `${emojis.info} ${result.note}`);
        if (!result?.ok) return;
        const saved = true;
        const header = savedHeader(result) + revertHint(result.changeIds, a, b);
        const rrow = saved ? revertRow(result.changeIds, a, b) : null;
        const viewOut = c === 'L' ? await listBack(doc, b, header, rrow) : await cardFor(doc, a, b, { header, resultRow: rrow });
        await show(interaction, viewOut || await home(doc, header, interaction));
        if (saved) return askKinds(interaction, result.titles);
        return;
    }
    if (verb === 'endm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, 'edit'))) return;
        await deferSubmit(interaction);
        const doc = await getDoc();
        const d = V.allDraws(doc).find(x => x._key === a);
        if (!d) return say(interaction, GONE);
        const back = (header, rrow = null) => (c === 'L' ? listBack(doc, b, header, rrow) : cardFor(doc, a, b, { header, resultRow: rrow }));
        const want = readEnd(interaction, d);
        if (want.error) return say(interaction, `${emojis.cross} ${want.error} Nothing was saved.`);
        const op = planEnd(d, want);
        if (!op) return show(interaction, await back(`-# ${emojis.info} It already ends ${endWords(d._row)}. Nothing was saved.`));
        const result = await require('../../../core/changeset').commitSet([op], { actorId: interaction.user.id });
        if (!result.ok) return say(interaction, `${emojis.cross} Not saved: ${require('../shared').extractCommitError(result)}`);
        const after = await getDoc();
        const header = [`### ${emojis.checkmark} End date saved`, `- **Ends:** ~~${endWords(d._row)}~~ → ${wantWords(want)}`, ...(want.note ? [want.note] : [])].join('\n');
        const rrow = revertRow(result.changeIds, a, b);
        return show(interaction, c === 'L' ? await listBack(after, b, header, rrow) : await cardFor(after, a, b, { header, resultRow: rrow }));
    }
    if (verb === 'move' || verb === 'del') {
        if (!(await gate(interaction, verb === 'move' ? 'edit' : 'delete'))) return;
        return show(interaction, await confirmCard(await getDoc(), verb, a, b, interaction.user.id));
    }
    if (verb === 'moveok') {
        if (!(await gate(interaction, 'edit'))) return;
        const doc = await getDoc();
        const d = V.allDraws(doc).find(x => x._key === a);
        if (!d) return say(interaction, GONE);
        const to = d._sec === 'new' ? 'returning' : 'new';
        // The other list already holding this title would leave the draw listed twice once moved (2026-11-10 11:19 EST): refused, and the card says which.
        const { isSameDrawTitle } = require('../../../utils/search');
        const twin = (doc[`${to}Draws`] || []).find(x => isSameDrawTitle(x.title, d.title));
        if (twin) return say(interaction, `${emojis.cross} ${to === 'new' ? 'New' : 'Returning'} Draws already has **${twin.title}**. Delete one of the two first; nothing was moved.`);
        const plain = (x) => JSON.parse(JSON.stringify(x));
        const payload = { title: d.title, date: d.date, thumbnailUrl: d.thumbnailUrl || null, items: plain(d.items || []).map(({ _id, ...it }) => it), ...(d.priceType ? { priceType: d.priceType } : {}), category: to };
        // Delete and add in one commit: one Revert puts the draw back where it was. Its /calendar row is keyed by title, so it needs nothing.
        const result = await require('../../../core/changeset').commitSet([
            { type: 'draw.delete', target: { category: d._sec, elementId: String(d._id) } },
            { type: 'draw.add', payload },
        ], { actorId: interaction.user.id });
        if (!result.ok) return say(interaction, `${emojis.cross} The draw was not moved: ${require('../shared').extractCommitError(result)}`);
        const newKey = `${to[0]}:${result.results[1].applied.elementId}`;
        const after = await getDoc();
        // The moved draw has a new id, so its card walks its new section; Revert lands on the draw where it was.
        return show(interaction, V.cardView(after, newKey, { back: to, header: `### ${emojis.checkmark} Moved to ${to === 'new' ? 'New' : 'Returning'} Draws`, resultRow: revertRow(result.changeIds, '', d._sec) }) || await home(after, null, interaction));
    }
    if (verb === 'delok') {
        if (!(await gate(interaction, 'delete')) || !(await gateDestructive(interaction))) return;
        const doc = await getDoc();
        const d = V.allDraws(doc).find(x => x._key === a);
        if (!d) return say(interaction, GONE);
        let changeIds;
        if (c === 'r' && d._row) {
            // With its /calendar row (2026-11-10 11:19 EST): one commit, so one Revert brings both back. The row's delete needs the Calendar tier, which commitSet checks.
            const result = await require('../../../core/changeset').commitSet([
                { type: 'draw.delete', target: { category: d._sec, elementId: String(d._id) } },
                { type: 'calendar.delete', target: { elementId: String(d._row._id) } },
            ], { actorId: interaction.user.id });
            if (!result.ok) return say(interaction, `${emojis.cross} Nothing was deleted: ${require('../shared').extractCommitError(result)}`);
            changeIds = result.changeIds;
        } else changeIds = await drawsSave().deleteDraw({ type: d._sec, id: String(d._id) }, interaction.user.id);
        const listKey = V.STATUS[b] ? b : d._sec;
        return show(interaction, V.resultView({ crumbs: [V.STATUS[listKey].label], title: `Deleted ${d.title}${c === 'r' ? ' and its /calendar row' : ''}`, body: ['-# Every change is recorded; Revert puts it back.'], back: ['list', listKey, 0], backLabel: V.STATUS[listKey].label, extraButtons: revertButton(changeIds, '', listKey) }));
    }

    // ----- purge ----- Each button names how many draws it removes (2026-11-10 11:19 EST): the one question a destructive confirm must answer.
    if (verb === 'purge') {
        if (!(await gate(interaction, 'purgeall'))) return;
        const doc = await getDoc();
        const all = V.allDraws(doc);
        const count = (k) => all.filter(V.STATUS[k].test).length;
        return show(interaction, V.resultView({
            ok: 'warn', crumbs: ['Purge'], title: 'Purge which draws?',
            body: [`-# For the end of a season. **${all.length}** draws now: ${count('new')} New, ${count('returning')} Returning, ${count('ended')} ended. /calendar rows stay. Every purge is recorded and can be reverted.`],
            back: 'page', backLabel: 'Cancel',
            extraButtons: [
                ...(count('ended') ? [V.btn(['purgeok', 'ended'], `Ended Only · ${count('ended')}`, emojis.redDotGlow, 4)] : []),
                V.btn(['purgeok', 'new'], `New Only · ${count('new')}`, emojis.newDraws, 4, !count('new')),
                V.btn(['purgeok', 'returning'], `Returning Only · ${count('returning')}`, emojis.returningDraws, 4, !count('returning')),
                V.btn(['purgeok', 'all'], `All · ${all.length}`, emojis.deleteBin, 4, !all.length),
            ],
        }));
    }
    if (verb === 'purgeok') {
        const scope = ['new', 'returning', 'all', 'ended'].includes(a) ? a : null;
        if (!scope) return show(interaction, await home(null, null, interaction));
        if (!(await gate(interaction, scope === 'ended' ? 'bulkdelete' : `purge${scope}`)) || !(await gateDestructive(interaction))) return;
        await interaction.deferUpdate();
        let note, changeIds;
        if (scope === 'ended') {
            // The ended draws only, as one bulk delete (the same op Select's Delete N commits).
            const doc = await getDoc();
            const ended = V.allDraws(doc).filter(V.STATUS.ended.test);
            const ids = { newDraws: ended.filter(d => d._sec === 'new').map(d => String(d._id)), returningDraws: ended.filter(d => d._sec === 'returning').map(d => String(d._id)) };
            const result = ended.length ? await require('../../../core/changeset').commitSet([{ type: 'draw.bulkDelete', payload: { ids } }], { actorId: interaction.user.id }) : { ok: true, changeIds: [] };
            note = result.ok ? `${emojis.checkmark} Purged the ${V.plural(ended.length, 'ended draw')}.` : `${emojis.cross} ${require('../shared').extractCommitError(result)}`;
            changeIds = result.ok ? result.changeIds : [];
        } else ({ confirmMsg: note, changeIds } = await drawsSave().purgeDraws(scope, interaction.user.id));
        return show(interaction, await home(null, note + revertHint(changeIds), interaction, { noteRow: revertRow(changeIds) }));
    }

    // ----- search and select -----
    if (verb === 'findm' && interaction.isModalSubmit?.()) {
        const doc = await getDoc();
        const q = interaction.fields.getTextInputValue('q');
        const keys = searchKeys(doc, q);
        if (!keys.length) return say(interaction, `${emojis.cross} No draw matches \`${q.slice(0, 60)}\` in its title or items.`);
        if (keys.length === 1) return show(interaction, V.cardView(doc, keys[0]));
        const token = await createSelection({ ids: keys, selected: [], query: [q.slice(0, 100)] });
        return show(interaction, V.searchView(doc, token, await loadSel(token)));
    }
    if (verb === 'checkm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, 'exportnew'))) return;
        const names = interaction.fields.getTextInputValue('names');
        // What was pasted, and the lines that found a draw, kept for Check Again, Quick Add These and the way back from a card (IX.runCheck).
        const { result, found } = await IX.runCheck(names, await getDoc());
        const token = await createSelection({ text: String(names).slice(0, 4000), query: found });
        return show(interaction, V.checkView(result, token, found.length));
    }
    if (verb === 'selectm' && interaction.isModalSubmit?.()) {
        const doc = await getDoc();
        const names = field(interaction, 'names') || '';
        const picks = [].concat(field(interaction, 'picks') || []);
        const { keys, unmatched } = resolveKeys(doc, names, picks);
        const query = [...String(names).split('\n').map(x => x.trim()).filter(Boolean), ...(picksLabel(picks) ? [picksLabel(picks)] : [])];
        const token = await createSelection({ ids: keys, selected: [], query, unmatched });
        return show(interaction, V.selectView(doc, token, await loadSel(token)));
    }
    if (verb === 'sellist') {
        const doc = await getDoc();
        const { keys } = resolveKeys(doc, '', [a]);
        const token = await createSelection({ ids: keys, selected: [], query: [V.STATUS[a]?.label || a] });
        return show(interaction, V.selectView(doc, token, await loadSel(token)));
    }
    if (['flip', 'all', 'none', 'slist', 'tedit', 'teditm', 'texp', 'tdel', 'tdelok', 'save', 'pastem', 'tendm'].includes(verb)) return routeSelection(interaction, verb, a, b, c);

    // ----- export -----
    if (verb === 'exportm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, 'exportnew'))) return;
        const doc = await getDoc();
        const names = field(interaction, 'names') || '';
        const picks = [].concat(field(interaction, 'picks') || []);
        const include = [].concat(field(interaction, 'include') || []);
        const dest = [].concat(field(interaction, 'dest') || 'file')[0];
        const { keys } = String(names).trim() || picks.length ? resolveKeys(doc, names, picks) : { keys: V.allDraws(doc).map(d => d._key) };
        if (!keys.length) return say(interaction, `${emojis.cross} Nothing matched, so there is nothing to export.`);
        const file = exportFile(doc, keys, include);
        const summary = `${emojis.copyExport} **${keys.length}** draw${keys.length === 1 ? '' : 's'}`;
        if (dest === 'dm') {
            try { await interaction.user.send({ content: summary, files: [file] }); }
            catch { return interaction.reply({ content: `${emojis.cross} Your DMs are closed to Dioreo, so here it is instead.\n${summary}`, files: [file], flags: 64 }); }
            return say(interaction, `${emojis.checkmark} Sent to your DMs: ${summary}`);
        }
        return interaction.reply({ content: summary, files: [file], flags: 64 });
    }

    return say(interaction, `${emojis.cross} That button is from an older panel. Open \`/manage draws\` again.`);
}

// Draws as paste text, New then Returning, with the fields Include keeps (Add Multiple reads it back).
function exportText(doc, keys, include = ['end', 'image', 'type']) {
    const fmt = require('../../../utils/adminParser').formatDrawsAsBulkText;
    const want = new Set(keys);
    const pick = V.allDraws(doc).filter(d => want.has(d._key)).map(d => ({ ...d, thumbnailUrl: include.includes('image') ? d.thumbnailUrl : '', priceType: include.includes('type') ? d.priceType : '' }));
    const rf = include.includes('end') ? V.rowFor(doc) : null;
    const part = (sec, label) => { const list = pick.filter(d => d._sec === sec); return list.length ? `${label}\n${fmt(list, rf)}` : ''; };
    return [part('new', 'New Draws'), part('returning', 'Returning Draws')].filter(Boolean).join('\n\n');
}
// The export as a file named with the day it was made (2026-11-10 11:19 EST), so two exports never read the same in a downloads folder.
function exportFile(doc, keys, include) { return { attachment: Buffer.from(exportText(doc, keys, include), 'utf-8'), name: `draws-${new Date().toISOString().slice(0, 10)}.txt` }; }

async function routeSelection(interaction, verb, a, b, c) {
    const n = (x) => Number(x) || 0;
    const m = manageCommand();

    // Paste keeps its own text; it has no list.
    if (verb === 'pastem' && interaction.isModalSubmit?.()) {
        const newText = field(interaction, 'new_text') || '', retText = field(interaction, 'returning_text') || '';
        const token = await createSelection({ text: packText(newText, retText) });
        return show(interaction, await previewPanel(token, newText, retText, { isEdit: false }));
    }

    const sel = await loadSel(a);
    if (!sel) return say(interaction, EXPIRED);
    const keys = selectedKeys(sel);

    if (verb === 'flip' && interaction.isStringSelectMenu?.()) {
        const on = new Set(sel.selected);
        for (const v of interaction.values) { if (on.has(v)) on.delete(v); else on.add(v); }
        sel.selected = [...on];
        await setSel(a, { selected: sel.selected });
        return show(interaction, V.selectView(await getDoc(), a, sel, null, n(b)));
    }
    if (verb === 'all' || verb === 'none') {
        sel.selected = verb === 'all' ? [...sel.ids] : [];
        await setSel(a, { selected: sel.selected });
        return show(interaction, V.selectView(await getDoc(), a, sel, null, n(b)));
    }
    if (verb === 'slist') return show(interaction, V.selectView(await getDoc(), a, sel, null, n(b)));

    // Edit N: the selected draws as the two boxes (New, Returning), one line per draw, with no picture links (a line with none keeps its picture, withStoredLinks).
    if (verb === 'tedit') {
        if (!(await gate(interaction, 'bulkreplace'))) return;
        const doc = await getDoc();
        if (!keys.length) return show(interaction, V.selectView(doc, a, sel, null, n(b)));
        let newText, retText;
        if (c === 'again' && sel.text) ({ newText, retText } = unpackText(sel.text));
        else {
            const fmt = require('../../../utils/adminParser').formatDrawsAsBulkText;
            const want = new Set(keys);
            const pick = V.allDraws(doc).filter(d => want.has(d._key)).map(d => ({ ...d, thumbnailUrl: '' }));
            newText = fmt(pick.filter(d => d._sec === 'new'), V.rowFor(doc));
            retText = fmt(pick.filter(d => d._sec === 'returning'), V.rowFor(doc));
        }
        if (newText.length > 4000 || retText.length > 4000) return show(interaction, V.selectView(doc, a, sel, `${emojis.warn} **Too many draws for one Edit pop-up** (each box holds 4,000 characters). Select fewer.`, n(b)));
        return interaction.showModal(fill(reId(m.buildBulkBothDrawsModal('replace'), V.ID('teditm', a), `Edit ${V.plural(keys.length, 'Draw')}`), { new_text: newText, returning_text: retText }));
    }
    if (verb === 'teditm' && interaction.isModalSubmit?.()) {
        const newText = field(interaction, 'new_text') || '', retText = field(interaction, 'returning_text') || '';
        await setSel(a, { text: packText(newText, retText) });
        return show(interaction, await previewPanel(a, newText, retText, { isEdit: true }));
    }
    // Save for Paste and Edit N: only the lines that add or change something go to Replace Multiple, and the result (with Revert) is shown here (quiet, 2026-11-10 11:19 EST).
    if (verb === 'save') {
        const isEdit = sel.ids.length > 0;
        if (!(await gate(interaction, isEdit ? 'bulkreplace' : 'bulkadd'))) return;
        const { newText, retText } = unpackText(sel.text);
        const doc = await getDoc();
        const pv = previewDraws(doc, newText, retText);
        const backTo = isEdit ? ['slist', a, 0] : 'page';
        if (!pv.count) return show(interaction, V.resultView({ title: 'Nothing to save: every draw is unchanged.', ok: 'warn', back: backTo, backLabel: isEdit ? 'Back to List' : 'Home' }));
        await interaction.deferUpdate();
        const result = await require('../draws').bulkAddOrReplaceDraws(interaction, { customId: 'modal_draws_bulk_replace_both', values: { new_text: withStoredLinks(doc, pv.keepNew, 'new').join('\n'), returning_text: withStoredLinks(doc, pv.keepRet, 'returning').join('\n') } }, { quiet: true });
        if (!result?.ok) return show(interaction, V.resultView({ crumbs: isEdit ? ['Select Draws', 'Edit'] : ['Paste'], title: 'Nothing was saved', body: [result?.error || 'The save was refused.'], ok: false, back: isEdit ? ['tedit', a, 0, 'again'] : ['paste', a], backLabel: isEdit ? 'Edit Again' : 'Edit Paste' }));
        // The draws first, then their end dates (the saver lists the end dates first because it writes them second).
        const ordered = [...result.sections.filter(s => s.head !== 'End dates'), ...result.sections.filter(s => s.head === 'End dates')];
        const body = [...ordered.filter(s => s.lines?.length).map(s => `**${s.head}**\n${s.lines.join('\n')}`), ...result.warnings.map(w => `${emojis.warn} ${w}`)];
        await show(interaction, V.resultView({ ok: result.warnings.length ? 'warn' : true, crumbs: isEdit ? ['Select Draws', 'Edit'] : ['Paste'], title: `Saved ${V.plural(pv.count, 'draw')}`, body: [...body, `-# Every change is recorded; Revert puts it back.${revertHint(result.changeIds)}`], back: backTo, backLabel: isEdit ? 'Back to List' : 'Home', extraButtons: revertButton(result.changeIds, '', isEdit ? `s:${a}` : '') }));
        return askKinds(interaction, result.titles);
    }
    // End Date for every selected draw (2026-11-10 11:19 EST): one commit of their calendar rows, skipping any that already read so or that the end would not be after.
    if (verb === 'tendm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, 'edit'))) return;
        await interaction.deferUpdate();
        const doc = await getDoc();
        const byKey = new Map(V.allDraws(doc).map(d => [d._key, d]));
        const want = readEnd(interaction);
        if (want.error) return say(interaction, `${emojis.cross} ${want.error} Nothing was saved.`);
        const ops = [], done = [], skipped = [];
        for (const k of keys) {
            const d = byKey.get(k);
            if (!d) continue;
            if (want.choice === 'date' && Number.isFinite(d.startMs) && want.endDate.getTime() <= d.startMs) { skipped.push(`${d.title} (starts after that)`); continue; }
            const op = planEnd(d, want);
            if (op) { ops.push(op); done.push(d.title); } else skipped.push(`${d.title} (already so)`);
        }
        if (!ops.length) return show(interaction, V.selectView(doc, a, sel, `${emojis.info} Nothing changed: ${skipped.join(', ').slice(0, 1500)}`));
        const result = await require('../../../core/changeset').commitSet(ops, { actorId: interaction.user.id });
        if (!result.ok) return say(interaction, `${emojis.cross} Not saved: ${require('../shared').extractCommitError(result)}`);
        return show(interaction, V.resultView({ crumbs: ['Select Draws'], title: `End date set on ${V.plural(done.length, 'draw')}: ${wantWords(want)}`, body: [...done.map(t => `- ${t}`), ...(skipped.length ? [`-# Left as they were: ${skipped.join(', ')}`] : []), ...(want.note ? [want.note] : []), `-# Revert puts every one back.${revertHint(result.changeIds)}`], back: ['slist', a, 0], backLabel: 'Back to List', extraButtons: revertButton(result.changeIds, '', `s:${a}`) }));
    }

    if (verb === 'texp') {
        if (!(await gate(interaction, 'exportnew'))) return;
        if (!keys.length) return show(interaction, V.selectView(await getDoc(), a, sel));
        return interaction.reply({ content: `${emojis.copyExport} **${keys.length}** draw${keys.length === 1 ? '' : 's'}`, files: [exportFile(await getDoc(), keys)], flags: 64 });
    }
    if (verb === 'tdel') {
        if (!(await gate(interaction, 'bulkdelete'))) return;
        const doc = await getDoc();
        if (!keys.length) return show(interaction, V.selectView(doc, a, sel, null, n(b)));
        const byKey = new Map(V.allDraws(doc).map(d => [d._key, d]));
        const list = keys.filter(k => byKey.has(k)).map(k => byKey.get(k));
        const lines = list.map(d => `- ${V.dot(d)} ${d.title} · ${V.secWord(d)}`);
        const withRow = list.filter(d => d._row);
        const rows = withRow.length && await calendarAllowed(interaction.user.id, withRow.slice(0, 1).map(d => ({ type: 'calendar.delete', target: { elementId: String(d._row._id) } }))) ? withRow.length : 0;
        return show(interaction, V.resultView({ ok: 'warn', crumbs: ['Select Draws'], title: `Delete ${V.plural(lines.length, 'draw')}?`, body: [...(lines.length > 20 ? [...lines.slice(0, 20), `-# …and ${lines.length - 20} more`] : lines), '', `-# ${rows ? `**Yes, Delete** keeps their /calendar rows; **Delete + Calendar Rows** removes those ${rows} too.` : withRow.length ? 'Their /calendar rows stay.' : 'None of them has a /calendar row.'} Every change can be reverted.`], back: ['slist', a, n(b)], backLabel: 'Cancel', extraButtons: [V.btn(['tdelok', a], `Yes, Delete ${lines.length}`, emojis.deleteBin, 4), ...(rows ? [V.btn(['tdelok', a, 'r'], 'Delete + Calendar Rows', emojis.calendar, 4)] : [])] }));
    }
    if (verb === 'tdelok') {
        if (!(await gate(interaction, 'bulkdelete')) || !(await gateDestructive(interaction))) return;
        const ids = { newDraws: [], returningDraws: [] };
        for (const k of keys) { const { section, id } = V.splitKey(k); ids[section === 'new' ? 'newDraws' : 'returningDraws'].push(id); }
        await interaction.deferUpdate();
        const ops = [{ type: 'draw.bulkDelete', payload: { ids } }];
        if (b === 'r') {
            // Their /calendar rows too, each once (two draws can share a row only by mistake, but a repeated delete would fail the commit).
            const doc = await getDoc();
            const want = new Set(keys);
            const rowIds = [...new Set(V.allDraws(doc).filter(d => want.has(d._key) && d._row).map(d => String(d._row._id)))];
            ops.push(...rowIds.map(id => ({ type: 'calendar.delete', target: { elementId: id } })));
        }
        const result = await require('../../../core/changeset').commitSet(ops, { actorId: interaction.user.id });
        if (!result.ok) return show(interaction, V.resultView({ title: 'Nothing was deleted', body: [require('../shared').extractCommitError(result)], ok: false, back: ['slist', a, 0], backLabel: 'Back to List' }));
        const goneKeys = new Set(keys);
        await setSel(a, { ids: sel.ids.filter(k => !goneKeys.has(k)), selected: [] });
        return show(interaction, V.resultView({ crumbs: ['Select Draws'], title: `Deleted ${V.plural(keys.length, 'draw')}${b === 'r' ? ' and their /calendar rows' : ''}`, body: [`-# Every change is recorded; Revert puts them back.${revertHint(result.changeIds)}`], back: ['slist', a, 0], backLabel: 'Back to List', extraButtons: revertButton(result.changeIds, '', `s:${a}`) }));
    }
    return say(interaction, EXPIRED);
}

// The /manage dispatcher's entry (handlers/manage/index.js): TRUE when the id is this panel's.
async function handleDrawsPanelInteraction(interaction) {
    if (typeof interaction.customId !== 'string' || !interaction.customId.startsWith(PREFIX)) return false;
    await route(interaction);
    return true;
}

module.exports = {
    calendarAllowed, confirmCard, handleDrawsPanelInteraction, renderHome, openFromSlash, autocomplete, previewDraws, exportText, resolveKeys, searchKeys, picksLabel, planEnd, readEnd, withStoredLinks, revertButton, PREFIX };
