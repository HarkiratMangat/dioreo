// ==========================================
// /manage calendar — the rehauled panel: routing, permission checks, saves
// ==========================================
// Built 2026-11-07 21:06 EST on the draws panel's shape (handlers/manage/drawsPanel/, v3.14.0), as the next section of the /manage rehaul.
//
// ⚠️ SAVES GO THROUGH THE EXISTING CODE. Add Entry and Banners open the real pop-ups (their submits are handlers/manage/calendar.js's, unchanged); Edit hands its pop-up to calendar.js editCalendarEvent; Paste and Edit N save through bulkAddOrReplaceCalendar (Replace: an existing title is updated, a new one added) with only the lines that change something; Delete uses deleteItem; Delete N commits calendar.bulkDelete; Purge uses purge. No write is re-implemented here, so the ChangeLog, Revert and the permission checks stay the ones the old page used.
//
// ⚠️ PERMISSIONS: the router's /manage lock runs first (`mng_`); every action here also runs utils/manageActions.js resolveAction for its own tier before it opens a pop-up or writes, and a delete or purge re-checks the destructive tier. core/changeset.js commitSet checks every op once more. Paste is gated as `replacemultiple` because that is the op it saves through (calendar.bulkReplace).
//
// ⚠️ THE CRASH NET IS THE ROUTER'S. Nothing here catches to swallow; error-branch replies are awaited.

const emojis = require('../../../utils/emojiMap');
const { sendV2Payload } = require('../../../utils/sendV2Payload');
const V = require('./views');

const PREFIX = 'mng_ca|';
const manageCommand = () => require('../../../commands/manage');
const calendarSave = () => require('../calendar');
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
    } catch (e) { console.error('manage calendar: could not answer (interaction likely expired):', e.message); }
}

// ---------- permission per action ----------
async function gate(interaction, action) {
    const { resolveAction, DENIAL_MESSAGE } = require('../../../utils/manageActions');
    const g = await resolveAction('calendar', action, interaction.user.id);
    if (g.ok) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, g.message || DENIAL_MESSAGE[g.reason] || `${emojis.accessDenied} You do not have access to that.`);
    return false;
}
async function gateDestructive(interaction) {
    const { can } = require('../../../utils/adminAccess');
    if (await can(interaction.user.id, 'manage.calendar', 'destructive')) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, `${emojis.accessDenied} **You don't have access to delete calendar entries anymore.** Nothing was deleted.`);
    return false;
}

// ---------- the selection store (models/ManageSelection.js, mode CALENDAR) ----------
const newToken = () => require('crypto').randomBytes(6).toString('base64url');
async function createSelection(data = {}) { const token = newToken(); await ManageSelection().create({ _id: token, mode: 'CALENDAR', ...data }); return token; }
async function loadSel(token) { const s = token ? await ManageSelection().findById(token).lean() : null; return s && s.mode === 'CALENDAR' ? s : null; }
const setSel = (token, fields) => ManageSelection().updateOne({ _id: token }, { $set: fields });
const selectedKeys = (sel) => { const on = new Set(sel.selected); return sel.ids.filter(k => on.has(k)); };

// ---------- home ----------
async function home(doc, note = null, interaction = null) {
    const showEmojis = interaction ? require('../../../utils/owner').isOwnerId(interaction.user.id) : false;
    return V.pageView(doc || await getDoc(), note, { pageRow: manageCommand().buildPageSelectRow('calendar', { showEmojis }) });
}
async function renderHome(interaction) { return show(interaction, await home(await getDoc(), null, interaction)); }

// ---------- finding entries ---------- Every typed word must be in the title.
const wordsOf = (s) => String(s || '').toLowerCase().split(/\s+/).filter(Boolean);
function resolveKeys(doc, names, picks = []) {
    const all = V.allEntries(doc);
    const keys = new Set();
    for (const p of picks) if (V.STATUS[p]) all.filter(V.STATUS[p].test).forEach(e => keys.add(e._key));
    const unmatched = [];
    for (const line of String(names || '').split(/\n|,/).map(x => x.trim()).filter(Boolean)) {
        const words = wordsOf(line);
        const hits = all.filter(e => words.every(w => e.title.toLowerCase().includes(w)));
        if (!hits.length) unmatched.push(line);
        hits.forEach(e => keys.add(e._key));
    }
    return { keys: [...keys], unmatched };
}
// Search Calendar's matcher (the draws redesign): each line is an entry's words (all in its title), lines widen each other, and lists narrow them: within types (Events, Playlists, Draws) or states (Upcoming, Active Now, Leaving Soon, Ended) a pick widens, across them it narrows, Needs a Look narrows on its own. Both blank is every entry.
const GROUP = { events: 'type', playlists: 'type', draws: 'type', upcoming: 'state', live: 'state', leaving: 'state', ended: 'state', warn: 'look' };
function findKeys(doc, text, picks = []) {
    const all = V.allEntries(doc);
    const lines = String(text || '').split('\n').map(x => x.trim()).filter(Boolean);
    const unmatched = [];
    let pool = all;
    if (lines.length) {
        const hit = new Set();
        for (const line of lines) {
            const words = wordsOf(line);
            const found = all.filter(e => words.every(w => e.title.toLowerCase().includes(w)));
            if (!found.length) unmatched.push(line);
            found.forEach(e => hit.add(e._key));
        }
        pool = all.filter(e => hit.has(e._key));
    }
    const groups = {};
    for (const p of (picks || []).filter(p => V.STATUS[p])) (groups[GROUP[p] || p] ||= []).push(p);
    pool = pool.filter(e => Object.values(groups).every(g => g.some(p => V.STATUS[p].test(e))));
    return { keys: pool.map(e => e._key), unmatched };
}
const field = (i, id) => { try { const f = i.fields.getField(id); return f?.value ?? f?.values ?? null; } catch { return null; } };

// ---------- paste text ---------- What pasted or edited calendar lines would do, line by line against the rows saved now, matched the way Replace saves them (utils/bulkMerge.js upsertByTitle: the same title, else the best fuzzy match). `keep` is the lines that add or change something, which is all Save sends, so an Edit N left as it was saves nothing. A bulleted paste can carry several entries on one line; the line is kept when any of them changes.
function previewCalendar(doc, raw) {
    const { parseBulkEvents } = require('../../../utils/adminParser');
    const { bestDrawMatch, fuzzyMatch } = require('../../../utils/search');
    const out = { added: [], changed: [], same: [], keep: [], skipped: [] };
    const norm = (t) => String(t || '').trim().toLowerCase();
    // The paste format is M/D with no year (utils/adminParser.js formatCalendarAsBulkText writes UTC M/D), so a date is compared by its UTC month and day: a row from last year would otherwise read as changed on every Edit N.
    const md = (x) => { if (!x) return ''; const d = new Date(x); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };
    const stored = doc.calendar || [];
    const emojiFor = (c) => ({ draw: emojis.newDraws, playlist: emojis.modes }[c] || emojis.events);
    for (const line of String(raw || '').split('\n').map(x => x.trim()).filter(Boolean)) {
        const parsed = parseBulkEvents(line);
        if (!parsed.length) { out.skipped.push(line.slice(0, 80)); continue; }
        let touches = false;
        for (const p of parsed) {
            const old = stored.find(s => norm(s.title) === norm(p.title)) || bestDrawMatch(stored, p.title, x => x.title, (itemTitle, title) => fuzzyMatch(title, itemTitle));
            const label = `${emojiFor(p.category)} ${p.title}`;
            if (!old) { out.added.push(label); touches = true; continue; }
            const diff = [];
            if (old.title !== p.title) diff.push('title');
            if (md(old.date) !== md(p.startDate)) diff.push('start');
            if (!!old.isOngoing !== !!p.isOngoing || (!p.isOngoing && md(old.endDate) !== md(p.endDate))) diff.push('end');
            if ((old.category || 'event') !== p.category) diff.push('type');
            if (!!old.isDoubleCP !== !!p.isDoubleCP) diff.push('2x CP');
            if (diff.length) { out.changed.push(`${label} · *${diff.join(', ')}*`); touches = true; } else out.same.push(p.title);
        }
        if (touches) out.keep.push(line);
    }
    const cap = (list, max = 20) => (list.length > max ? [...list.slice(0, max), `-# …and ${list.length - max} more`] : list);
    const parts = [];
    if (out.added.length) parts.push(`${emojis.mngAdd} **Added · ${out.added.length}**`, ...cap(out.added.map(x => `- ${x}`)), '');
    if (out.changed.length) parts.push(`${emojis.mngBulkReplace} **Changed · ${out.changed.length}**`, ...cap(out.changed.map(x => `- ${x}`)), '');
    if (out.same.length) parts.push(`-# Unchanged · ${out.same.length}: ${out.same.join(', ').slice(0, 700)}`, '');
    if (out.skipped.length) parts.push(`${emojis.warn} **Not read · ${out.skipped.length}**`, ...cap(out.skipped.map(x => `- \`${x}\``), 8), '-# A line looks like `7/2 - 8/5 | Title`; a letter and a bullet before it (`p• …`) sets the type.', '');
    // A preview where nothing changed says so, and has no Save to press (2026-11-11 17:03 EST: it read "Nothing is saved until you press Save" with no Save button, under a green check).
    parts.push((out.added.length + out.changed.length) ? '-# Nothing is saved until you press Save.' : '-# Nothing changed, so there is nothing to save.');
    return { ...out, parts, count: out.added.length + out.changed.length, total: out.added.length + out.changed.length + out.same.length };
}

function fill(modal, values) {
    const json = modal.toJSON ? modal.toJSON() : JSON.parse(JSON.stringify(modal));
    for (const r of json.components || []) for (const c of [...(r.components || []), ...(r.component ? [r.component] : [])]) if (values[c.custom_id] !== undefined) c.value = String(values[c.custom_id]).slice(0, c.max_length || 4000);
    return json;
}
const reId = (modal, customId, title) => { const j = modal.toJSON ? modal.toJSON() : JSON.parse(JSON.stringify(modal)); j.custom_id = customId; if (title) j.title = title.slice(0, 45); return j; };

async function previewPanel(token, text, { isEdit }) {
    const doc = await getDoc();
    const pv = previewCalendar(doc, text);
    return V.resultView({
        ok: pv.skipped.length || !pv.count ? 'warn' : true, crumbs: isEdit ? ['Selected', 'Edit'] : ['Bulk Paste'],
        title: `${isEdit ? 'Edit' : 'Bulk Paste'} preview · ${pv.count} of ${pv.total} to save`, body: pv.parts,
        back: isEdit ? ['tedit', token, 0, 'again'] : ['paste', token], backLabel: isEdit ? 'Edit Again' : 'Edit Paste',
        extraButtons: pv.count ? [V.btn(['save', token], `Save ${pv.count}`, emojis.checkmark, 3)] : [],
        extraRows: isEdit ? [V.row(V.btn(['slist', token, 0], 'Back to Selected', emojis.returnArrow))] : [],
    });
}

function revertButton(changeIds) {
    // The panel's own Revert, so it lands back on the calendar home rather than a bare note (results.js revertChanges does the reverting and its permission check).
    const id = `${PREFIX}revert|${(changeIds || []).join(',')}`;
    return changeIds?.length && id.length <= 100 ? [{ type: 2, style: 4, label: 'Revert', custom_id: id, emoji: emojis.parseEmoji(emojis.keep) }] : [];
}

// ---------- the entry pop-ups ----------
async function editModal(doc, key, customId) {
    const e = V.allEntries(doc).find(x => x._key === key);
    if (!e) return null;
    return reId(manageCommand().buildEditCalendarModal(e, String(e._id)), customId, `Edit ${e.title}`);
}
function confirmCard(doc, key, back = null) {
    const e = V.allEntries(doc).find(x => x._key === key);
    if (!e) return home(doc, `${emojis.cross} That entry no longer exists.`);
    return V.cardView(doc, key, { back, header: `### ${emojis.warn} Delete ${e.title}?\n-# Every change can be reverted.`, extra: [V.row(V.btn(['delok', key], 'Yes, Delete', emojis.deleteBin, 4), V.btn(['card', key], 'Cancel', emojis.returnArrow))] });
}

// ---------- the slash command ---------- `event:` opens an entry (autocomplete), `show:` a list, `do:` an action (with an entry, at once). A pop-up has to be the first answer, so every path that opens one runs before anything is deferred.
const SHOW_LIST = { event: 'events', playlist: 'playlists', draw: 'draws', upcoming: 'upcoming', live: 'live', leaving: 'leaving', ended: 'ended' };
async function openFromSlash(interaction) {
    const o = interaction.options;
    const entryValue = o.getString('event'), act = o.getString('do'), list = o.getString('show');
    const ephemeral = o.getString('visibility') !== 'public';
    const view = (components) => show(interaction, components, { ephemeral });
    const m = manageCommand();
    if (act === 'add') return (await gate(interaction, 'add')) && interaction.showModal(m.buildCalendarAddModal());
    if (act === 'paste') return (await gate(interaction, 'replacemultiple')) && interaction.showModal(reId(m.buildCalendarBulkModal('add'), V.ID('pastem'), 'Bulk Paste'));
    if (act === 'export') return (await gate(interaction, 'export')) && interaction.showModal(V.exportModal());
    if (act === 'banners') return (await gate(interaction, 'banners')) && interaction.showModal(m.buildCalendarBannersModal(await getDoc()));
    if (act === 'guide') return runGuide(interaction);
    const doc = await getDoc();
    if (entryValue) {
        let key = entryValue;
        if (!V.allEntries(doc).some(e => e._key === key)) {
            const { keys } = resolveKeys(doc, entryValue, []);
            if (keys.length !== 1) return view(await home(doc, `${emojis.cross} ${keys.length ? `${keys.length} entries match` : 'No entry matches'} \`${entryValue.slice(0, 60)}\`. Pick one from the list, or type more of its title.`, interaction));
            key = keys[0];
        }
        if (act === 'edit') return (await gate(interaction, 'edit')) && interaction.showModal(await editModal(doc, key, V.ID('editm', key)));
        if (act === 'delete') return (await gate(interaction, 'delete')) && view(confirmCard(doc, key));
        return view(V.cardView(doc, key));
    }
    if (list && SHOW_LIST[list]) return view(V.listView(doc, SHOW_LIST[list]));
    if (act) return view(await home(doc, `${emojis.warn} That needs an \`event:\` to act on.`, interaction));
    return view(await home(doc, null, interaction));
}

async function runGuide(interaction) {
    if (!(await gate(interaction, 'formatguide'))) return;
    const action = require('../../../utils/manageActions').ACTIONS_BY_PAGE.calendar.find(x => x.id === 'formatguide');
    return action.run({ interaction, page: 'calendar', manageCommand: manageCommand() });
}

// Every typed word against titles, newest first; the name says what kind of entry it is.
async function autocomplete(interaction) {
    const words = wordsOf(interaction.options.getFocused());
    const doc = await getDoc();
    const hits = V.allEntries(doc).filter(e => words.every(w => e.title.toLowerCase().includes(w))).sort((a, b) => (b.startMs || 0) - (a.startMs || 0)).slice(0, 25);
    return interaction.respond(hits.map(e => ({ name: `${e.title} · ${V.typeWord(e)}`.slice(0, 100), value: e._key })));
}

// ---------- routing ----------
async function route(interaction) {
    const [, verb, a, b, c] = interaction.customId.split('|');
    const m = manageCommand();
    const n = (x) => Number(x) || 0;
    const noEntry = async (doc) => show(interaction, await home(doc, `${emojis.cross} That entry no longer exists.`, interaction));

    // ----- pop-ups first (a pop-up has to be the first answer) -----
    if (verb === 'find') return interaction.showModal(V.searchModal(await getDoc()));
    if (verb === 'sres') { const sel = await loadSel(a); return sel ? show(interaction, V.searchView(await getDoc(), a, sel, n(b))) : say(interaction, `${emojis.cross} Those results expired (lists last a day). Search again.`); }
    if (verb === 'export') return (await gate(interaction, 'export')) && interaction.showModal(V.exportModal());
    if (verb === 'guide') return runGuide(interaction);
    if (verb === 'add') return (await gate(interaction, 'add')) && interaction.showModal(m.buildCalendarAddModal());
    if (verb === 'banners') return (await gate(interaction, 'banners')) && interaction.showModal(m.buildCalendarBannersModal(await getDoc()));
    // Add the Draw on a draw row that has none on /draws (the /manage audit's finding 11): /manage draws' own Quick Add, filled with the row's title and dates, gated as that button is.
    if (verb === 'qadraw') {
        const { resolveAction, DENIAL_MESSAGE } = require('../../../utils/manageActions');
        const g = await resolveAction('draws', 'quickadd', interaction.user.id);
        if (!g.ok) { require('../../../utils/eventStore').markOutcome('rejected_admin'); return say(interaction, g.message || DENIAL_MESSAGE[g.reason] || `${emojis.accessDenied} You do not have access to that.`); }
        const e = ((await getDoc())?.calendar || []).find(x => `c:${x._id}` === a);
        if (!e) return show(interaction, await home(await getDoc(), `${emojis.cross} That entry no longer exists.`, interaction));
        const day = (x) => { const iso = new Date(x).toISOString(); return iso.slice(11, 16) === '00:00' ? iso.slice(0, 10) : `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`; };
        const line = [e.title, e.date ? `starts ${day(e.date)}` : null, e.endDate ? `ends ${day(require('../../../utils/adminParser').endDayOf(e.endDate))}` : null].filter(Boolean).join(', ');
        return interaction.showModal(m.buildQuickAddModal({ value: line }));
    }
    if (verb === 'paste') {
        if (!(await gate(interaction, 'replacemultiple'))) return;
        const last = a ? await loadSel(a) : null;
        return interaction.showModal(fill(reId(m.buildCalendarBulkModal('add'), V.ID('pastem'), 'Bulk Paste'), { bulk_text: last?.text || '' }));
    }
    if (verb === 'edit') {
        if (!(await gate(interaction, 'edit'))) return;
        const doc = await getDoc();
        const modal = await editModal(doc, a, V.ID('editm', a));
        return modal ? interaction.showModal(modal) : noEntry(doc);
    }

    // ----- views -----
    if (verb === 'page') return renderHome(interaction);
    if (verb === 'revert') return require('../results').revertChanges(interaction, String(a || '').split(',').filter(Boolean), { doneNote: 'everything is back as it was', render: async (note) => home(await getDoc(), note, interaction) });
    if (verb === 'browse' && interaction.isStringSelectMenu?.()) return show(interaction, V.listView(await getDoc(), interaction.values[0]));
    if (verb === 'list') return show(interaction, V.listView(await getDoc(), a, n(b)));
    if (verb === 'open' && interaction.isStringSelectMenu?.()) {
        const doc = await getDoc();
        const v = V.cardView(doc, interaction.values[0], { back: a });
        return v ? show(interaction, v) : noEntry(doc);
    }
    if (verb === 'card') {
        const doc = await getDoc();
        const v = V.cardView(doc, a);
        return v ? show(interaction, v) : noEntry(doc);
    }

    // ----- one entry -----
    if (verb === 'editm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, 'edit'))) return;
        const opts = { customId: `edit_calendar_${V.splitKey(a)}` };
        // From the panel the card under the pop-up is redrawn in place, and the saved panel (with Revert) follows it; from the slash command there is no card, so the save answers alone.
        if (!interaction.message) return calendarSave().editCalendarEvent(interaction, opts);
        await interaction.deferUpdate();
        await calendarSave().editCalendarEvent(interaction, opts);
        const doc = await getDoc();
        return show(interaction, V.cardView(doc, a, { header: `-# ${emojis.checkmark} Saved. The result, with Revert, is in the message below.` }) || await home(doc, null, interaction));
    }
    if (verb === 'del') {
        if (!(await gate(interaction, 'delete'))) return;
        return show(interaction, confirmCard(await getDoc(), a));
    }
    if (verb === 'delok') {
        if (!(await gate(interaction, 'delete')) || !(await gateDestructive(interaction))) return;
        const doc = await getDoc();
        const e = V.allEntries(doc).find(x => x._key === a);
        if (!e) return noEntry(doc);
        const changeIds = await calendarSave().deleteItem({ id: String(e._id) }, interaction.user.id);
        const backTo = { draw: 'draws', playlist: 'playlists' }[e._cat] || 'events';
        return show(interaction, V.resultView({ crumbs: [V.STATUS[backTo].label], title: `Deleted ${e.title}`, body: ['-# Every change is recorded; Revert puts it back.'], back: ['list', backTo, 0], backLabel: V.STATUS[backTo].label, extraButtons: revertButton(changeIds) }));
    }

    // ----- purge -----
    if (verb === 'purge') {
        if (!(await gate(interaction, 'purge'))) return;
        return show(interaction, V.resultView({ ok: 'warn', title: 'Purge the whole calendar?', body: ['-# For the end of a season: every calendar entry is removed. The purge is recorded and can be reverted.'], back: 'page', backLabel: 'Cancel', extraButtons: [V.btn(['purgeok'], 'Yes, Purge Calendar', emojis.deleteBin, 4)] }));
    }
    if (verb === 'purgeok') {
        if (!(await gate(interaction, 'purge')) || !(await gateDestructive(interaction))) return;
        await interaction.deferUpdate();
        const { confirmMsg, changeIds } = await calendarSave().purge(interaction.user.id);
        return show(interaction, V.resultView({ title: 'Calendar purge', ok: changeIds?.length ? true : false, body: [confirmMsg, '-# Revert it here, or from `/bot analytics` › Changes.'], back: 'page', backLabel: 'Home', extraButtons: revertButton(changeIds) }));
    }

    // ----- search and select ----- One Search (the draws redesign): words, one entry per line, widen each other; lists narrow them; both blank is every entry. One match opens its card; none answers privately.
    if (verb === 'findm' && interaction.isModalSubmit?.()) {
        const doc = await getDoc();
        const q = field(interaction, 'q') || '';
        const picks = [].concat(field(interaction, 'picks') || []);
        const { keys, unmatched } = findKeys(doc, q, picks);
        const what = [...String(q).split('\n').map(x => x.trim()).filter(Boolean).map(x => `\`${x.slice(0, 40)}\``), ...picks.filter(p => V.STATUS[p]).map(p => V.STATUS[p].label)];
        if (!keys.length) return say(interaction, `${emojis.cross} No entry matches ${what.join(' · ') || 'that'}.`);
        if (keys.length === 1) return show(interaction, V.cardView(doc, keys[0]));
        const token = await createSelection({ ids: keys, selected: [], query: what, unmatched });
        return show(interaction, V.searchView(doc, token, await loadSel(token)));
    }
    // A list made into a selection: its Select menu, or Select All.
    if ((verb === 'lpick' && interaction.isStringSelectMenu?.()) || verb === 'lall') {
        const doc = await getDoc();
        const list = V.listOf(doc, a).map(e => e._key);
        const token = await createSelection({ ids: list, selected: verb === 'lall' ? list : interaction.values.filter(v => list.includes(v)), query: [V.STATUS[a]?.label || a] });
        return show(interaction, V.selectView(doc, token, await loadSel(token)));
    }
    if (['pick', 'unpick', 'all', 'none', 'slist', 'tedit', 'teditm', 'texp', 'tdel', 'tdelok', 'save', 'pastem'].includes(verb)) return routeSelection(interaction, verb, a, b, c);

    // ----- export -----
    if (verb === 'exportm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, 'export'))) return;
        const doc = await getDoc();
        const names = field(interaction, 'names') || '';
        const picks = field(interaction, 'picks') || [];
        const dest = [].concat(field(interaction, 'dest') || 'file')[0];
        const { keys } = String(names).trim() || picks.length ? resolveKeys(doc, names, picks) : { keys: V.allEntries(doc).map(e => e._key) };
        if (!keys.length) return say(interaction, `${emojis.cross} Nothing matched, so there is nothing to export.`);
        const file = { attachment: Buffer.from(exportText(doc, keys), 'utf-8'), name: 'calendar.txt' };
        const summary = `${emojis.copyExport} **${keys.length}** calendar ${keys.length === 1 ? 'entry' : 'entries'}`;
        if (dest === 'dm') {
            try { await interaction.user.send({ content: summary, files: [file] }); }
            catch { return interaction.reply({ content: `${emojis.cross} Your DMs are closed to Dioreo, so here it is instead.\n${summary}`, files: [file], flags: 64 }); }
            return say(interaction, `${emojis.checkmark} Sent to your DMs: ${summary}`);
        }
        return interaction.reply({ content: summary, files: [file], flags: 64 });
    }

    return say(interaction, `${emojis.cross} That button is from an older panel. Open \`/manage calendar\` again.`);
}

// The chosen entries as paste text, in start order (Paste reads it back: formatCalendarAsBulkText is what the old Export wrote).
function exportText(doc, keys) {
    const want = new Set(keys);
    const rows = V.allEntries(doc).filter(e => want.has(e._key)).sort((a, b) => (a.startMs || 0) - (b.startMs || 0));
    return require('../../../utils/adminParser').formatCalendarAsBulkText(rows);
}

async function routeSelection(interaction, verb, a, b, c) {
    const n = (x) => Number(x) || 0;
    const m = manageCommand();

    // Paste keeps its own text; it has no list.
    if (verb === 'pastem' && interaction.isModalSubmit?.()) {
        const text = field(interaction, 'bulk_text') || '';
        const token = await createSelection({ text });
        return show(interaction, await previewPanel(token, text, { isEdit: false }));
    }

    const sel = await loadSel(a);
    if (!sel) return say(interaction, `${emojis.cross} That list expired. Search again.`);
    const keys = selectedKeys(sel);

    // The results' Select menu adds; the Selected view's Unselect menu takes away.
    if ((verb === 'pick' || verb === 'unpick') && interaction.isStringSelectMenu?.()) {
        const on = new Set(sel.selected);
        for (const v of interaction.values) { if (verb === 'pick') on.add(v); else on.delete(v); }
        sel.selected = sel.ids.filter(k => on.has(k));
        await setSel(a, { selected: sel.selected });
        return show(interaction, V.selectView(await getDoc(), a, sel, null, n(b)));
    }
    if (verb === 'all' || verb === 'none') {
        sel.selected = verb === 'all' ? [...sel.ids] : [];
        await setSel(a, { selected: sel.selected });
        return show(interaction, V.selectView(await getDoc(), a, sel, null, n(b)));
    }
    if (verb === 'slist') return show(interaction, V.selectView(await getDoc(), a, sel, null, n(b)));

    // Edit N: the selected entries as today's paste text, one line each.
    if (verb === 'tedit') {
        if (!(await gate(interaction, 'replacemultiple'))) return;
        const doc = await getDoc();
        if (!keys.length) return show(interaction, V.selectView(doc, a, sel, null, n(b)));
        const text = c === 'again' && sel.text ? sel.text : exportText(doc, keys);
        // A refusal answers privately and leaves the panel as it was (the draws panel's round-2 rule, carried here 2026-11-11 16:46 EST).
        if (text.length > 4000) return say(interaction, `${emojis.warn} **Too many entries for one Edit pop-up** (the box holds 4,000 characters). Select fewer.`);
        return interaction.showModal(fill(reId(m.buildCalendarBulkModal('replace'), V.ID('teditm', a), `Edit ${keys.length} ${keys.length === 1 ? 'Entry' : 'Entries'}`), { bulk_text: text }));
    }
    if (verb === 'teditm' && interaction.isModalSubmit?.()) {
        const text = field(interaction, 'bulk_text') || '';
        await setSel(a, { text });
        return show(interaction, await previewPanel(a, text, { isEdit: true }));
    }
    // Save for Paste and Edit N: only the lines that add or change something go to Replace, whose result (with Revert) follows this message.
    if (verb === 'save') {
        const isEdit = sel.ids.length > 0;
        if (!(await gate(interaction, 'replacemultiple'))) return;
        const pv = previewCalendar(await getDoc(), sel.text);
        // Misses, refusals and nothing-changed answer privately and leave the panel as it was (round 2's rule; the 2026-11-11 16:46 EST think-pass found these still drawn in the panel).
        if (!pv.count) return say(interaction, `${emojis.info} Nothing to save: every entry is unchanged.`);
        await interaction.deferUpdate();
        await calendarSave().bulkAddOrReplaceCalendar(interaction, { customId: 'modal_calendar_bulk_replace', values: { bulk_text: pv.keep.join('\n') } });
        return show(interaction, V.resultView({ crumbs: isEdit ? ['Selected', 'Edit'] : ['Bulk Paste'], title: `Sent ${pv.count} to save`, body: ['-# The result, with Revert, is in the message below.'], back: isEdit ? ['slist', a, 0] : 'page', backLabel: isEdit ? 'Back to Selected' : 'Home' }));
    }

    if (verb === 'texp') {
        if (!(await gate(interaction, 'export'))) return;
        if (!keys.length) return show(interaction, V.selectView(await getDoc(), a, sel));
        return interaction.reply({ content: `${emojis.copyExport} **${keys.length}** calendar ${keys.length === 1 ? 'entry' : 'entries'}`, files: [{ attachment: Buffer.from(exportText(await getDoc(), keys), 'utf-8'), name: 'calendar.txt' }], flags: 64 });
    }
    if (verb === 'tdel') {
        if (!(await gate(interaction, 'deletemultiple'))) return;
        const doc = await getDoc();
        if (!keys.length) return show(interaction, V.selectView(doc, a, sel, null, n(b)));
        const byKey = new Map(V.allEntries(doc).map(e => [e._key, e]));
        const lines = keys.filter(k => byKey.has(k)).map(k => `- ${V.dot(byKey.get(k))} ${byKey.get(k).title} · ${V.typeWord(byKey.get(k))}`);
        return show(interaction, V.resultView({ ok: 'warn', crumbs: ['Selected'], title: `Delete ${lines.length} ${lines.length === 1 ? 'entry' : 'entries'}?`, body: [...(lines.length > 20 ? [...lines.slice(0, 20), `-# …and ${lines.length - 20} more`] : lines), '', '-# Every change is recorded and can be reverted.'], back: ['slist', a, n(b)], backLabel: 'Cancel', extraButtons: [V.btn(['tdelok', a], `Yes, Delete ${lines.length}`, emojis.deleteBin, 4)] }));
    }
    if (verb === 'tdelok') {
        if (!(await gate(interaction, 'deletemultiple')) || !(await gateDestructive(interaction))) return;
        const ids = keys.map(V.splitKey);
        await interaction.deferUpdate();
        const result = await require('../../../core/changeset').commitSet([{ type: 'calendar.bulkDelete', payload: { ids } }], { actorId: interaction.user.id });
        if (!result.ok) return say(interaction, `${emojis.cross} **Nothing was deleted.** ${require('../shared').extractCommitError(result)}`);
        const gone = new Set(keys);
        await setSel(a, { ids: sel.ids.filter(k => !gone.has(k)), selected: [] });
        return show(interaction, V.resultView({ crumbs: ['Selected'], title: `Deleted ${keys.length} ${keys.length === 1 ? 'entry' : 'entries'}`, body: ['-# Every change is recorded; Revert puts them back.'], back: ['slist', a, 0], backLabel: 'Back to Selected', extraButtons: revertButton(result.changeIds) }));
    }
    return say(interaction, `${emojis.cross} That list expired. Search again.`);
}

// The /manage dispatcher's entry (handlers/manage/index.js): TRUE when the id is this panel's.
async function handleCalendarPanelInteraction(interaction) {
    if (typeof interaction.customId !== 'string' || !interaction.customId.startsWith(PREFIX)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleCalendarPanelInteraction, renderHome, openFromSlash, autocomplete, previewCalendar, exportText, resolveKeys, findKeys, PREFIX };
