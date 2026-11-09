// ==========================================
// /manage draws — the rehauled panel: routing, permission checks, saves
// ==========================================
// Built 2026-11-07 19:15 EST from the /mockdraws mock-up, on his word (2026-11-07 19:11 EST): "i'm leaving it under your design critique and judgement. just let me know once everything is done and you need to merge". The same shape as the gunsmith panel (handlers/manage/gunsmith/, v3.13.0).
//
// ⚠️ SAVES GO THROUGH THE EXISTING CODE. Quick Add, Add New and Add Returning open the real pop-ups; Edit hands its pop-up to handlers/manage/draws.js editDraw; Set End Date opens /manage's own calendar pop-ups; Paste and Edit N save through bulkAddOrReplaceDraws (Replace: an existing title is updated, a new one added) with only the lines that change something; Delete uses deleteDraw; Delete N commits draw.bulkDelete; Purge uses purgeDraws. Move is the one new write: draw.delete and draw.add in ONE commit, so one Revert puts it back.
//
// ⚠️ PERMISSIONS: the router's /manage lock runs first (`mng_`); every action here also runs utils/manageActions.js resolveAction for its own tier before it opens a pop-up or writes, and a delete or purge re-checks the destructive tier. core/changeset.js commitSet checks every op once more.
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

// ---------- permission per action ----------
async function gate(interaction, action) {
    const { resolveAction, DENIAL_MESSAGE } = require('../../../utils/manageActions');
    const g = await resolveAction('draws', action, interaction.user.id);
    if (g.ok) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, g.message || DENIAL_MESSAGE[g.reason] || `${emojis.accessDenied} You do not have access to that.`);
    return false;
}
async function gateDestructive(interaction) {
    const { can } = require('../../../utils/adminAccess');
    if (await can(interaction.user.id, 'manage.draws', 'destructive')) return true;
    require('../../../utils/eventStore').markOutcome('rejected_admin');
    await say(interaction, `${emojis.accessDenied} **You don't have access to delete draws anymore.** Nothing was deleted.`);
    return false;
}

// ---------- the selection store (models/ManageSelection.js, mode DRAWS) ----------
const newToken = () => require('crypto').randomBytes(6).toString('base64url');
async function createSelection(data = {}) { const token = newToken(); await ManageSelection().create({ _id: token, mode: 'DRAWS', ...data }); return token; }
async function loadSel(token) { const s = token ? await ManageSelection().findById(token).lean() : null; return s && s.mode === 'DRAWS' ? s : null; }
const setSel = (token, fields) => ManageSelection().updateOne({ _id: token }, { $set: fields });
const expired = () => V.resultView({ title: 'That list expired. Select again.', ok: false, back: 'select', backLabel: 'Select Draws' });
const selectedKeys = (sel) => { const on = new Set(sel.selected); return sel.ids.filter(k => on.has(k)); };
// Paste / Edit N keep both boxes' text as JSON in the selection's `text`.
const packText = (newText, retText) => JSON.stringify({ newText: newText || '', retText: retText || '' });
const unpackText = (s) => { try { const j = JSON.parse(s || '{}'); return { newText: j.newText || '', retText: j.retText || '' }; } catch { return { newText: '', retText: '' }; } };

// ---------- home ----------
async function home(doc, note = null, interaction = null) {
    const showEmojis = interaction ? require('../../../utils/owner').isOwnerId(interaction.user.id) : false;
    return V.pageView(doc || await getDoc(), note, { pageRow: manageCommand().buildPageSelectRow('draws', { showEmojis }) });
}
async function renderHome(interaction) { return show(interaction, await home(await getDoc(), null, interaction)); }

// ---------- finding draws ----------
function resolveKeys(doc, names, picks = []) {
    const all = V.allDraws(doc);
    const keys = new Set();
    for (const p of picks) if (V.STATUS[p]) all.filter(V.STATUS[p].test).forEach(d => keys.add(d._key));
    const unmatched = [];
    for (const line of String(names || '').split(/\n|,/).map(x => x.trim()).filter(Boolean)) {
        const words = line.toLowerCase().split(/\s+/);
        const hits = all.filter(d => words.every(w => d.title.toLowerCase().includes(w)));
        if (!hits.length) unmatched.push(line);
        hits.forEach(d => keys.add(d._key));
    }
    return { keys: [...keys], unmatched };
}
const field = (i, id) => { try { const f = i.fields.getField(id); return f?.value ?? f?.values ?? null; } catch { return null; } };

// ---------- paste text ---------- What pasted or edited draw lines would do, line by line against the draws saved now, matched the way Replace Multiple saves them (utils/bulkMerge.js upsertByTitle: the same title, else the best fuzzy match). `keepNew` / `keepRet` are the lines that add or change something, which is all Save sends, so an Edit N left as it was saves nothing.
function previewDraws(doc, newText, retText) {
    const { parseBulkDrawList } = require('../../../utils/adminParser');
    const { bestDrawMatch, fuzzyMatch } = require('../../../utils/search');
    const out = { added: [], changed: [], same: [], keepNew: [], keepRet: [], skipped: [] };
    const norm = (t) => String(t || '').trim().toLowerCase();
    // A pasted line carries a day, never a time (Add Multiple reads dates as UTC midnight), so dates are compared by their UTC day.
    const day = (x) => (x ? new Date(x).toISOString().slice(0, 10) : '');
    for (const [sec, raw] of [['new', newText], ['returning', retText]]) {
        const stored = doc[sec === 'new' ? 'newDraws' : 'returningDraws'] || [];
        const keep = sec === 'new' ? out.keepNew : out.keepRet;
        for (const line of String(raw || '').split('\n').map(x => x.trim()).filter(Boolean)) {
            const [p] = parseBulkDrawList(line);
            if (!p) { out.skipped.push(line.slice(0, 80)); keep.push(line); continue; }
            const old = stored.find(s => norm(s.title) === norm(p.title)) || bestDrawMatch(stored, p.title, x => x.title, (itemTitle, title) => fuzzyMatch(title, itemTitle));
            const label = `${sec === 'new' ? emojis.newDraws : emojis.returningDraws} ${p.title}`;
            if (!old) { out.added.push(label); keep.push(line); continue; }
            const diff = [];
            if (old.title !== p.title) diff.push('title');
            if (day(old.date) !== day(p.date)) diff.push('date');
            if ((old.items || []).map(i => `${i.tier}|${i.name}`).join(';') !== (p.items || []).map(i => `${i.tier}|${i.name}`).join(';')) diff.push('items');
            if (p.thumbnailUrl && p.thumbnailUrl !== old.thumbnailUrl) diff.push('picture');
            if (p.priceType && p.priceType !== (old.priceType || '')) diff.push('draw type');
            if (p.endDate) {
                const row = require('../../../utils/drawEndReminder').calendarRowFor(doc, old.title);
                if (!row?.endDate || day(row.endDate) !== day(p.endDate)) diff.push('end date');
            }
            if (diff.length) { out.changed.push(`${label} · *${diff.join(', ')}*`); keep.push(line); } else out.same.push(p.title);
        }
    }
    const cap = (list, max = 20) => (list.length > max ? [...list.slice(0, max), `-# …and ${list.length - max} more`] : list);
    const parts = [];
    if (out.added.length) parts.push(`${emojis.mngAdd} **Added · ${out.added.length}**`, ...cap(out.added.map(x => `- ${x}`)), '');
    if (out.changed.length) parts.push(`${emojis.mngBulkReplace} **Changed · ${out.changed.length}**`, ...cap(out.changed.map(x => `- ${x}`)), '');
    if (out.same.length) parts.push(`-# Unchanged · ${out.same.length}: ${out.same.join(', ').slice(0, 700)}`, '');
    if (out.skipped.length) parts.push(`${emojis.warn} **Not read · ${out.skipped.length}**`, ...cap(out.skipped.map(x => `- \`${x}\``), 8), '-# A line needs a title, at least one item and a date, split by commas.', '');
    parts.push('-# Nothing is saved until you press Save.');
    return { ...out, parts, count: out.added.length + out.changed.length, total: out.added.length + out.changed.length + out.same.length };
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

function revertButton(changeIds) {
    // The panel's own Revert, so it lands back on the draws home rather than a bare note (results.js revertChanges does the reverting and its permission check).
    const id = `${PREFIX}revert|${(changeIds || []).join(',')}`;
    return changeIds?.length && id.length <= 100 ? [{ type: 2, style: 4, label: 'Revert', custom_id: id, emoji: emojis.parseEmoji(emojis.keep) }] : [];
}

// ---------- the draw pop-ups ----------
async function editModal(doc, key, customId) {
    const d = V.allDraws(doc).find(x => x._key === key);
    if (!d) return null;
    return reId(manageCommand().buildEditDrawModal(d, String(d._id), d._sec, V.rowFor(doc)(d)), customId, `Edit ${d.title}`);
}
function endModal(doc, key) {
    const d = V.allDraws(doc).find(x => x._key === key);
    if (!d) return null;
    const row = V.rowFor(doc)(d);
    const { formatAdminDate } = require('../../../utils/adminParser');
    // /manage's own calendar pop-ups, so the save, its warnings and its Revert are the calendar page's.
    return row ? manageCommand().buildEditCalendarModal(row, String(row._id)) : manageCommand().buildCalendarAddModal({ title: d.title, startDate: d.date ? formatAdminDate(new Date(d.date)) : '', endDate: '' });
}
async function confirmCard(doc, kind, key) {
    const d = V.allDraws(doc).find(x => x._key === key);
    if (!d) return home(doc, `${emojis.cross} That draw no longer exists.`);
    const q = kind === 'move'
        ? `### ${emojis.warn} Move ${d.title} to ${d._sec === 'new' ? 'Returning' : 'New'} Draws?\n-# Its items, picture, draw type and end date go with it.`
        : `### ${emojis.warn} Delete ${d.title}?\n-# Its /calendar row stays. Every change can be reverted.`;
    return V.cardView(doc, key, { header: q, extra: [V.row(V.btn([`${kind}ok`, key], kind === 'move' ? 'Yes, Move' : 'Yes, Delete', kind === 'move' ? emojis.checkmark : emojis.deleteBin, kind === 'move' ? 3 : 4), V.btn(['card', key], 'Cancel', emojis.returnArrow))] });
}

// ---------- the slash command ---------- `draw:` opens a draw (autocomplete), `show:` a list, `do:` an action (with a draw, at once). A pop-up has to be the first answer, so every path that opens one runs before anything is deferred.
async function openFromSlash(interaction) {
    const o = interaction.options;
    const drawValue = o.getString('draw'), act = o.getString('do'), list = o.getString('show');
    const ephemeral = o.getString('visibility') !== 'public';
    const view = (components) => show(interaction, components, { ephemeral });
    const m = manageCommand();
    if (act === 'quickadd') return (await gate(interaction, 'quickadd')) && interaction.showModal(m.buildQuickAddModal());
    if (act === 'addnew' || act === 'addreturning') return (await gate(interaction, act)) && interaction.showModal(m.buildAddDrawModal(act === 'addnew' ? 'new' : 'returning'));
    if (act === 'paste') return (await gate(interaction, 'bulkadd')) && interaction.showModal(reId(m.buildBulkBothDrawsModal('add'), V.ID('pastem'), 'Paste Draws'));
    if (act === 'export') return (await gate(interaction, 'exportnew')) && interaction.showModal(V.exportModal());
    if (act === 'guide') return runGuide(interaction);
    const doc = await getDoc();
    if (drawValue) {
        let key = drawValue;
        if (!V.allDraws(doc).some(d => d._key === key)) {
            const { keys } = resolveKeys(doc, drawValue, []);
            if (keys.length !== 1) return view(await home(doc, `${emojis.cross} ${keys.length ? `${keys.length} draws match` : 'No draw matches'} \`${drawValue.slice(0, 60)}\`. Pick one from the list, or type more of its title.`, interaction));
            key = keys[0];
        }
        if (act === 'edit') return (await gate(interaction, 'edit')) && interaction.showModal(await editModal(doc, key, V.ID('editm', key)));
        if (act === 'end') return (await gate(interaction, 'edit')) && interaction.showModal(endModal(doc, key));
        if (act === 'move') return (await gate(interaction, 'edit')) && view(await confirmCard(doc, 'move', key));
        if (act === 'delete') return (await gate(interaction, 'delete')) && view(await confirmCard(doc, 'del', key));
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

async function autocomplete(interaction) {
    const q = String(interaction.options.getFocused() || '').toLowerCase();
    const doc = await getDoc();
    const words = q.split(/\s+/).filter(Boolean);
    const hits = V.allDraws(doc).filter(d => words.every(w => d.title.toLowerCase().includes(w))).sort((a, b) => (b.startMs || 0) - (a.startMs || 0)).slice(0, 25);
    return interaction.respond(hits.map(d => ({ name: `${d.title} · ${V.secWord(d)}`.slice(0, 100), value: d._key })));
}

// ---------- routing ----------
async function route(interaction) {
    const [, verb, a, b, c] = interaction.customId.split('|');
    const m = manageCommand();
    const n = (x) => Number(x) || 0;

    // ----- pop-ups first (a pop-up has to be the first answer) -----
    if (verb === 'find') return interaction.showModal(V.searchModal());
    if (verb === 'select') return interaction.showModal(V.selectModal());
    if (verb === 'export') return (await gate(interaction, 'exportnew')) && interaction.showModal(V.exportModal());
    // Check Draw Index reads, never writes: Export's read tier gates it.
    if (verb === 'check') return (await gate(interaction, 'exportnew')) && interaction.showModal(V.checkModal());
    if (verb === 'checkm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, 'exportnew'))) return;
        const { checkIndex } = require('../../../utils/drawIndexCheck');
        const entries = await require('../../../utils/drawCatalog').loadCatalog({ force: true });
        const result = checkIndex(entries, interaction.fields.getTextInputValue('names'), { seasonalDoc: await getDoc(), isSameTitle: require('../../../utils/search').isSameDrawTitle });
        return show(interaction, V.checkView(result));
    }
    if (verb === 'guide') return runGuide(interaction);
    if (verb === 'quickadd') return (await gate(interaction, 'quickadd')) && interaction.showModal(m.buildQuickAddModal());
    if (verb === 'addnew' || verb === 'addreturning') return (await gate(interaction, verb)) && interaction.showModal(m.buildAddDrawModal(verb === 'addnew' ? 'new' : 'returning'));
    if (verb === 'paste') {
        if (!(await gate(interaction, 'bulkadd'))) return;
        const last = a ? await loadSel(a) : null;
        const { newText, retText } = unpackText(last?.text);
        return interaction.showModal(fill(reId(m.buildBulkBothDrawsModal('add'), V.ID('pastem'), 'Paste Draws'), { new_text: newText, returning_text: retText }));
    }
    if (verb === 'edit' || verb === 'end') {
        if (!(await gate(interaction, 'edit'))) return;
        const doc = await getDoc();
        const modal = verb === 'edit' ? await editModal(doc, a, V.ID('editm', a)) : endModal(doc, a);
        return modal ? interaction.showModal(modal) : show(interaction, await home(doc, `${emojis.cross} That draw no longer exists.`, interaction));
    }

    // ----- views -----
    if (verb === 'page') return renderHome(interaction);
    if (verb === 'revert') return require('../results').revertChanges(interaction, String(a || '').split(',').filter(Boolean), { doneNote: 'it is back as it was', render: async (note) => home(await getDoc(), note, interaction) });
    if (verb === 'browse' && interaction.isStringSelectMenu?.()) return show(interaction, V.listView(await getDoc(), interaction.values[0]));
    if (verb === 'list') return show(interaction, V.listView(await getDoc(), a, n(b)));
    if (verb === 'open' && interaction.isStringSelectMenu?.()) {
        const doc = await getDoc();
        return show(interaction, V.cardView(doc, interaction.values[0], { back: a }) || await home(doc, `${emojis.cross} That draw no longer exists.`, interaction));
    }
    if (verb === 'card') {
        const doc = await getDoc();
        return show(interaction, V.cardView(doc, a) || await home(doc, `${emojis.cross} That draw no longer exists.`, interaction));
    }

    // ----- one draw -----
    if (verb === 'editm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, 'edit'))) return;
        const { section, id } = V.splitKey(a);
        const opts = { customId: `edit_draw_${id}_${section}` };
        // From the panel the card under the pop-up is redrawn in place, and the saved panel (with Revert) follows it; from the slash command there is no card, so the save answers alone.
        if (!interaction.message) return drawsSave().editDraw(interaction, opts);
        await interaction.deferUpdate();
        await drawsSave().editDraw(interaction, opts);
        const doc = await getDoc();
        return show(interaction, V.cardView(doc, a, { header: `-# ${emojis.checkmark} Saved. The result, with Revert, is in the message below.` }) || await home(doc, null, interaction));
    }
    if (verb === 'move' || verb === 'del') {
        if (!(await gate(interaction, verb === 'move' ? 'edit' : 'delete'))) return;
        return show(interaction, await confirmCard(await getDoc(), verb, a));
    }
    if (verb === 'moveok') {
        if (!(await gate(interaction, 'edit'))) return;
        const doc = await getDoc();
        const d = V.allDraws(doc).find(x => x._key === a);
        if (!d) return show(interaction, await home(doc, `${emojis.cross} That draw no longer exists.`, interaction));
        const to = d._sec === 'new' ? 'returning' : 'new';
        const plain = (x) => JSON.parse(JSON.stringify(x));
        const payload = { title: d.title, date: d.date, thumbnailUrl: d.thumbnailUrl || null, items: plain(d.items || []).map(({ _id, ...it }) => it), ...(d.priceType ? { priceType: d.priceType } : {}), category: to };
        // Delete and add in one commit: one Revert puts the draw back where it was. Its /calendar row is keyed by title, so it needs nothing.
        const result = await require('../../../core/changeset').commitSet([
            { type: 'draw.delete', target: { category: d._sec, elementId: String(d._id) } },
            { type: 'draw.add', payload },
        ], { actorId: interaction.user.id });
        if (!result.ok) return show(interaction, V.resultView({ title: 'The draw was not moved', body: [require('../shared').extractCommitError(result)], ok: false, back: ['card', a], backLabel: d.title.slice(0, 60) }));
        const newKey = `${to[0]}:${result.results[1].applied.elementId}`;
        const after = await getDoc();
        return show(interaction, V.cardView(after, newKey, { header: `### ${emojis.checkmark} Moved to ${to === 'new' ? 'New' : 'Returning'} Draws`, extra: [V.row(...revertButton(result.changeIds), V.btn(['card', newKey], 'Open Draw', emojis.edit), V.homeBtn())] }) || await home(after, null, interaction));
    }
    if (verb === 'delok') {
        if (!(await gate(interaction, 'delete')) || !(await gateDestructive(interaction))) return;
        const doc = await getDoc();
        const d = V.allDraws(doc).find(x => x._key === a);
        if (!d) return show(interaction, await home(doc, `${emojis.cross} That draw no longer exists.`, interaction));
        const changeIds = await drawsSave().deleteDraw({ type: d._sec, id: String(d._id) }, interaction.user.id);
        return show(interaction, V.resultView({ crumbs: [`${V.secWord(d)} Draws`], title: `Deleted ${d.title}`, body: ['-# Every change is recorded; Revert puts it back.'], back: ['list', d._sec, 0], backLabel: `${V.secWord(d)} Draws`, extraButtons: revertButton(changeIds) }));
    }

    // ----- purge -----
    if (verb === 'purge') {
        if (!(await gate(interaction, 'purgeall'))) return;
        return show(interaction, V.resultView({ ok: 'warn', title: 'Purge which draws?', body: ['-# For the end of a season. Each purge is recorded and can be reverted from `/bot analytics` › Changes.'], back: 'page', backLabel: 'Cancel', extraButtons: [V.btn(['purgeok', 'new'], 'New Only', emojis.newDraws, 4), V.btn(['purgeok', 'returning'], 'Returning Only', emojis.returningDraws, 4), V.btn(['purgeok', 'all'], 'All Draws', emojis.deleteBin, 4)] }));
    }
    if (verb === 'purgeok') {
        const scope = ['new', 'returning', 'all'].includes(a) ? a : null;
        if (!scope) return show(interaction, await home(null, null, interaction));
        if (!(await gate(interaction, `purge${scope}`)) || !(await gateDestructive(interaction))) return;
        await interaction.deferUpdate();
        const { confirmMsg } = await drawsSave().purgeDraws(scope, interaction.user.id);
        return show(interaction, await home(null, `${confirmMsg}\n-# Revert it from \`/bot analytics\` › Changes.`, interaction));
    }

    // ----- search and select -----
    if (verb === 'findm' && interaction.isModalSubmit?.()) {
        const doc = await getDoc();
        const q = interaction.fields.getTextInputValue('q');
        const { keys } = resolveKeys(doc, q, []);
        if (!keys.length) return show(interaction, await home(doc, `${emojis.cross} No draw matches \`${q.slice(0, 60)}\`.`, interaction));
        if (keys.length === 1) return show(interaction, V.cardView(doc, keys[0]));
        const byKey = new Map(V.allDraws(doc).map(d => [d._key, d]));
        return show(interaction, V.resultView({
            crumbs: ['Search'], title: `${keys.length} draws match \`${q.slice(0, 60)}\``, back: 'find', backLabel: 'Search Again',
            extraRows: [{ type: 1, components: [{ type: 3, custom_id: V.ID('open', ''), placeholder: 'Pick a draw', options: keys.slice(0, 25).map(k => ({ label: byKey.get(k).title.slice(0, 100), value: k, description: V.secWord(byKey.get(k)) })) }] }],
        }));
    }
    if (verb === 'selectm' && interaction.isModalSubmit?.()) {
        const doc = await getDoc();
        const names = field(interaction, 'names') || '';
        const picks = field(interaction, 'picks') || [];
        const { keys, unmatched } = resolveKeys(doc, names, picks);
        const query = [...String(names).split('\n').map(x => x.trim()).filter(Boolean), ...picks.map(p => `All ${V.STATUS[p]?.label || p}`)];
        const token = await createSelection({ ids: keys, selected: [], query, unmatched });
        return show(interaction, V.selectView(doc, token, await loadSel(token)));
    }
    if (verb === 'sellist') {
        const doc = await getDoc();
        const { keys } = resolveKeys(doc, '', [a]);
        const token = await createSelection({ ids: keys, selected: [], query: [`All ${V.STATUS[a]?.label || a}`] });
        return show(interaction, V.selectView(doc, token, await loadSel(token)));
    }
    if (['flip', 'all', 'none', 'slist', 'tedit', 'teditm', 'texp', 'tdel', 'tdelok', 'save', 'pastem'].includes(verb)) return routeSelection(interaction, verb, a, b, c);

    // ----- export -----
    if (verb === 'exportm' && interaction.isModalSubmit?.()) {
        if (!(await gate(interaction, 'exportnew'))) return;
        const doc = await getDoc();
        const names = field(interaction, 'names') || '';
        const picks = field(interaction, 'picks') || [];
        const include = [].concat(field(interaction, 'include') || []);
        const dest = [].concat(field(interaction, 'dest') || 'file')[0];
        const { keys } = String(names).trim() || picks.length ? resolveKeys(doc, names, picks) : { keys: V.allDraws(doc).map(d => d._key) };
        if (!keys.length) return say(interaction, `${emojis.cross} Nothing matched, so there is nothing to export.`);
        const file = { attachment: Buffer.from(exportText(doc, keys, include), 'utf-8'), name: 'draws.txt' };
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
    if (!sel) return show(interaction, expired());
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

    // Edit N: the selected draws as today's two boxes (New, Returning), one line per draw.
    if (verb === 'tedit') {
        if (!(await gate(interaction, 'bulkreplace'))) return;
        const doc = await getDoc();
        if (!keys.length) return show(interaction, V.selectView(doc, a, sel, null, n(b)));
        let newText, retText;
        if (c === 'again' && sel.text) ({ newText, retText } = unpackText(sel.text));
        else {
            const fmt = require('../../../utils/adminParser').formatDrawsAsBulkText;
            const want = new Set(keys);
            const pick = V.allDraws(doc).filter(d => want.has(d._key));
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
    // Save for Paste and Edit N: only the lines that add or change something go to Replace Multiple, whose result (with Revert) follows this message.
    if (verb === 'save') {
        const isEdit = sel.ids.length > 0;
        if (!(await gate(interaction, isEdit ? 'bulkreplace' : 'bulkadd'))) return;
        const { newText, retText } = unpackText(sel.text);
        const pv = previewDraws(await getDoc(), newText, retText);
        if (!pv.count) return show(interaction, V.resultView({ title: 'Nothing to save: every draw is unchanged.', ok: 'warn', back: isEdit ? ['slist', a, 0] : 'page', backLabel: isEdit ? 'Back to List' : 'Home' }));
        await interaction.deferUpdate();
        await require('../draws').bulkAddOrReplaceDraws(interaction, { customId: 'modal_draws_bulk_replace_both', values: { new_text: pv.keepNew.join('\n'), returning_text: pv.keepRet.join('\n') } });
        return show(interaction, V.resultView({ crumbs: isEdit ? ['Select Draws', 'Edit'] : ['Paste'], title: `Sent ${V.plural(pv.count, 'draw')} to save`, body: ['-# The result, with Revert, is in the message below.'], back: isEdit ? ['slist', a, 0] : 'page', backLabel: isEdit ? 'Back to List' : 'Home' }));
    }

    if (verb === 'texp') {
        if (!(await gate(interaction, 'exportnew'))) return;
        if (!keys.length) return show(interaction, V.selectView(await getDoc(), a, sel));
        return interaction.reply({ content: `${emojis.copyExport} **${keys.length}** draw${keys.length === 1 ? '' : 's'}`, files: [{ attachment: Buffer.from(exportText(await getDoc(), keys), 'utf-8'), name: 'draws.txt' }], flags: 64 });
    }
    if (verb === 'tdel') {
        if (!(await gate(interaction, 'bulkdelete'))) return;
        const doc = await getDoc();
        if (!keys.length) return show(interaction, V.selectView(doc, a, sel, null, n(b)));
        const byKey = new Map(V.allDraws(doc).map(d => [d._key, d]));
        const lines = keys.filter(k => byKey.has(k)).map(k => `- ${V.dot(byKey.get(k))} ${byKey.get(k).title} · ${V.secWord(byKey.get(k))}`);
        return show(interaction, V.resultView({ ok: 'warn', crumbs: ['Select Draws'], title: `Delete ${V.plural(lines.length, 'draw')}?`, body: [...(lines.length > 20 ? [...lines.slice(0, 20), `-# …and ${lines.length - 20} more`] : lines), '', '-# Their /calendar rows stay. Every change is recorded and can be reverted.'], back: ['slist', a, n(b)], backLabel: 'Cancel', extraButtons: [V.btn(['tdelok', a], `Yes, Delete ${lines.length}`, emojis.deleteBin, 4)] }));
    }
    if (verb === 'tdelok') {
        if (!(await gate(interaction, 'bulkdelete')) || !(await gateDestructive(interaction))) return;
        const ids = { newDraws: [], returningDraws: [] };
        for (const k of keys) { const { section, id } = V.splitKey(k); ids[section === 'new' ? 'newDraws' : 'returningDraws'].push(id); }
        await interaction.deferUpdate();
        const result = await require('../../../core/changeset').commitSet([{ type: 'draw.bulkDelete', payload: { ids } }], { actorId: interaction.user.id });
        if (!result.ok) return show(interaction, V.resultView({ title: 'Nothing was deleted', body: [require('../shared').extractCommitError(result)], ok: false, back: ['slist', a, 0], backLabel: 'Back to List' }));
        const gone = new Set(keys);
        await setSel(a, { ids: sel.ids.filter(k => !gone.has(k)), selected: [] });
        return show(interaction, V.resultView({ crumbs: ['Select Draws'], title: `Deleted ${V.plural(keys.length, 'draw')}`, body: ['-# Every change is recorded; Revert puts them back.'], back: ['slist', a, 0], backLabel: 'Back to List', extraButtons: revertButton(result.changeIds) }));
    }
    return show(interaction, expired());
}

// The /manage dispatcher's entry (handlers/manage/index.js): TRUE when the id is this panel's.
async function handleDrawsPanelInteraction(interaction) {
    if (typeof interaction.customId !== 'string' || !interaction.customId.startsWith(PREFIX)) return false;
    await route(interaction);
    return true;
}

module.exports = { handleDrawsPanelInteraction, renderHome, openFromSlash, autocomplete, previewDraws, exportText, resolveKeys, PREFIX };
