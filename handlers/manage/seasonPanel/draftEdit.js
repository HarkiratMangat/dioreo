// ==========================================
// /manage season draft — paste with a preview, the draft calendar editor, one draft draw's card, the draft's banners
// ==========================================
// Built 2026-11-09 for the /manage audit's findings 1, 2, 3 and 5 (Harkirat, 17:59 EST: "go ahead with all your findings").
//
// - **Paste Draws / Paste Calendar ADD AND UPDATE, never replace** (findings 1 and 2). The box opens empty; its submit shows what the paste would do (utils/draftPaste.js: Added, Updated, Unchanged, Already staged in the other list, Not read) under Stage · Edit Paste · Back, the way the live Paste Draws and Paste Entries preview. Stage writes through handlers/manage/season.js saveDraftDraws / saveDraftCalendar, the same save the news card's box uses. They used to open prefilled with the whole staged list and replace it: past Discord's 4,000 characters discord.js threw building the box, and a save went through unseen.
// - **The draft calendar, one row at a time** (finding 2): a list with Edit beside each row, Add Entry, Remove Entries, Paste Calendar. A draw row with no staged draw says so.
// - **One draft draw's card** (finding 3): the draw as staged, with Edit, End Date (its draft calendar draw row, as the live End Date sets /calendar's), Move to New / Returning and Remove.
// - **Banners** (finding 5): the draft's three /calendar banners, which Promote already copied but nothing could set (season.setDraftBanners).
//
// Every write is one commitSet of season.bulkDraftDraws / season.bulkDraftCalendar (`parsed`) or season.setDraftBanners, so the ChangeLog, Revert and the armed auto-promote check behave as the rest of the draft. Each action is gated as the draft action it belongs to (bulkdraws for draws, bulkcalendar for the calendar and banners) by ./index.js's gate, passed in.
//
// ⚠️ A POP-UP HAS TO BE THE FIRST ANSWER: every opener gates, then shows the modal before anything is deferred. ⚠️ EMOJIS ARE READ INSIDE FUNCTIONS (utils/emojiMap.js values are re-pointed at boot).

const emojis = require('../../../utils/emojiMap');
const V = require('./views');

// ---------- the paste waiting for Stage ---------- In memory for 30 minutes, for the admin who pasted it (anyone else's press gets one line). A restart drops it; nothing is written before Stage.
const PASTES = new Map();
const PASTE_TTL = 30 * 60 * 1000;
function keepPaste(userId, data) {
    const token = require('crypto').randomBytes(5).toString('hex');
    PASTES.set(token, { userId: String(userId), at: Date.now(), ...data });
    setTimeout(() => PASTES.delete(token), PASTE_TTL).unref?.();
    return token;
}
const pasteFor = (token, userId) => { const p = PASTES.get(String(token || '')); return p && p.userId === String(userId) && Date.now() - p.at < PASTE_TTL ? p : null; };

// ---------- modal helpers ---------- Same shape as the draws and calendar panels' own.
const reId = (modal, customId, title) => { const j = modal.toJSON ? modal.toJSON() : JSON.parse(JSON.stringify(modal)); j.custom_id = customId; if (title) j.title = title.slice(0, 45); return j; };
function fill(json, values) {
    for (const r of json.components || []) for (const c of [...(r.components || []), ...(r.component ? [r.component] : [])]) if (values[c.custom_id] !== undefined && values[c.custom_id] !== '') c.value = String(values[c.custom_id]).slice(0, c.max_length || 4000);
    return json;
}
const field = (interaction, k) => { try { return interaction.fields.getTextInputValue(k) || ''; } catch { return ''; } };
const manage = () => require('../../../commands/manage');
const drawsBox = (values = {}) => fill(reId(manage().buildBulkBothDrawsModal('add'), V.ID('drm'), 'Paste Draws: Add or Update'), values);
const calendarBox = (values = {}) => fill(reId(manage().buildCalendarBulkModal('add'), V.ID('calm'), 'Paste Calendar: Add or Update'), values);

// ---------- small view pieces ----------
const { text, row, btn, panel, plural } = V;
const SMALL = () => ({ type: 14, divider: false, spacing: 1 });
const BIG = () => ({ type: 14, divider: true, spacing: 2 });
const crumb = (...p) => `-# ${['Season', ...p].join('  ›  ')}`;
const unix = (d) => Math.floor(new Date(d).getTime() / 1000);
const day = (d) => (d ? `<t:${unix(d)}:D>` : 'no date');
const arrow = (parts, dir, disabled) => ({ type: 2, style: 2, custom_id: V.ID(...[].concat(parts)), emoji: emojis.parseEmoji(dir === 'left' ? emojis.left : emojis.right), disabled });
const counter = (parts, label) => ({ type: 2, style: 2, label, custom_id: V.ID(...[].concat(parts)), disabled: true });
const list = (lines, max = 12) => (lines.length > max ? [...lines.slice(0, max), `-# and ${lines.length - max} more`] : lines).join('\n');
const SECTION = { new: 'New', returning: 'Returning' };

// ---------- the paste previews ----------
function drawsPreview(plan, token) {
    const parts = [];
    if (plan.added.length) parts.push(`**${emojis.mngAdd} Added · ${plan.added.length}**\n${list(plan.added.map(a => `- ${a.p.title} · ${SECTION[a.sec]} · ${day(a.p.date)}${a.p.thumbnailUrl ? '' : ' · picture found by name'}`))}`);
    if (plan.changed.length) parts.push(`**${emojis.edit} Updated · ${plan.changed.length}**\n${list(plan.changed.map(c => `- ${c.old.title !== c.p.title ? `~~${c.old.title}~~ → ` : ''}${c.p.title} · ${SECTION[c.sec]} · ${c.diff.join(', ')}`))}`);
    if (plan.same.length) parts.push(`-# Already staged as written: ${plan.same.slice(0, 8).join(', ')}${plan.same.length > 8 ? ` and ${plan.same.length - 8} more` : ''}`);
    if (plan.twins.length) parts.push(`**${emojis.warn} Already staged in the other list · ${plan.twins.length}**\n${list(plan.twins.map(t => `- ${t.title}: staged as ${t.staged} in ${t.sec === 'new' ? 'Returning' : 'New'}. Move it there with its card, or paste it in that box.`))}`);
    if (plan.skipped.length) parts.push(`**${emojis.cross} Not read · ${plan.skipped.length}**\n${list(plan.skipped.map(l => `- \`${l.replace(/`/g, "'")}\``), 6)}\n-# A draw line is Title, items, date, image link. The date is required.`);
    if (!parts.length) parts.push(`${emojis.cross} Nothing in the paste read as a draw.`);
    return panel([
        text(`${crumb('Next Season Draft', 'Draws', 'Paste')}\n## ${emojis.pasteImport} Paste Draws\n-# What Stage would do. Staged rows you did not paste are left as they are. Nothing reaches players until Promote to Live.`),
        BIG(),
        text(parts.join('\n\n').slice(0, 3700)),
        BIG(),
        row(btn(['dps', token], plan.count ? `Stage ${plan.count}` : 'Nothing to Stage', emojis.checkmark, 3, !plan.count), btn(['dpe', token], 'Edit Paste', emojis.edit), btn(['dd', 'n', 0], 'Back', emojis.returnArrow)),
    ]);
}
const calWhen = (r) => `${day(r.date)} › ${r.isOngoing ? 'All Season' : r.endDate ? day(r.endDate) : 'TBD'}`;
function calendarPreview(plan, token) {
    const parts = [];
    if (plan.added.length) parts.push(`**${emojis.mngAdd} Added · ${plan.added.length}**\n${list(plan.added.map(a => `- ${a.row.title} · ${a.row.category} · ${calWhen(a.row)}${a.row.isDoubleCP ? ' · 2X CP' : ''}`))}`);
    if (plan.changed.length) parts.push(`**${emojis.edit} Updated · ${plan.changed.length}**\n${list(plan.changed.map(c => `- ${c.old.title !== c.row.title ? `~~${c.old.title}~~ → ` : ''}${c.row.title} · ${c.diff.join(', ')} · ${calWhen(c.row)}`))}`);
    if (plan.same.length) parts.push(`-# Already staged as written: ${plan.same.slice(0, 8).join(', ')}${plan.same.length > 8 ? ` and ${plan.same.length - 8} more` : ''}`);
    if (plan.skipped.length) parts.push(`**${emojis.cross} Not read · ${plan.skipped.length}**\n${list(plan.skipped.map(l => `- \`${l.replace(/`/g, "'")}\``), 6)}\n-# A calendar line is \`11/12 - 11/26 | Title\`, or \`All Season\` / \`TBD\` for the end.`);
    if (!parts.length) parts.push(`${emojis.cross} Nothing in the paste read as a calendar line.`);
    return panel([
        text(`${crumb('Next Season Draft', 'Calendar', 'Paste')}\n## ${emojis.pasteImport} Paste Calendar\n-# What Stage would do. Staged rows you did not paste are left as they are. Nothing reaches players until Promote to Live.`),
        BIG(),
        text(parts.join('\n\n').slice(0, 3700)),
        BIG(),
        row(btn(['cps', token], plan.count ? `Stage ${plan.count}` : 'Nothing to Stage', emojis.checkmark, 3, !plan.count), btn(['cpe', token], 'Edit Paste', emojis.edit), btn(['dc', 0], 'Back', emojis.returnArrow)),
    ]);
}

// ---------- the draft calendar ---------- Seven rows a page (a row is a Section: 3 of Discord's 40). A row's key is its _id, else `@<index>` in the stored list (a row written before ids).
const DC_PER_PAGE = 7;
const rowKey = (r, i) => (r._id ? String(r._id) : `@${i}`);
const findRow = (calendar, key) => {
    if (String(key).startsWith('@')) { const i = Number(String(key).slice(1)); return calendar[i] ? { row: calendar[i], index: i } : null; }
    const index = calendar.findIndex(r => String(r._id) === String(key));
    return index >= 0 ? { row: calendar[index], index } : null;
};
const sortedCal = (doc) => (doc?.draft?.calendar || []).map((r, i) => ({ r, key: rowKey(r, i) })).sort((a, b) => new Date(a.r.date || 0) - new Date(b.r.date || 0));
function draftCalendarView(doc, page = 0, note = null, extraRow = null) {
    const { isSameDrawTitle } = require('../../../utils/search');
    const d = doc?.draft || {};
    const draws = [...(d.newDraws || []), ...(d.returningDraws || [])];
    const all = sortedCal(doc);
    const pages = Math.max(1, Math.ceil(all.length / DC_PER_PAGE));
    const pg = Math.min(Math.max(Number(page) || 0, 0), pages - 1);
    const shown = all.slice(pg * DC_PER_PAGE, pg * DC_PER_PAGE + DC_PER_PAGE);
    const components = [text(`${crumb('Next Season Draft', 'Calendar')}\n## ${emojis.calendar} Draft Calendar\n-# ${plural(all.length, 'row')}. Edit one at a time, add one, remove some, or paste many. Nothing goes live until Promote to Live.`)];
    if (note) components.push(SMALL(), text(note));
    components.push(BIG());
    if (!shown.length) components.push(text('-# Nothing staged here yet. Add Entry adds one; Paste Calendar adds many.'));
    for (const { r, key } of shown) {
        const orphan = r.category === 'draw' && !draws.some(x => isSameDrawTitle(x.title, r.title));
        components.push({ type: 9, components: [text(`**${r.title || '(untitled)'}**${r.isDoubleCP ? ' · 2X CP' : ''}\n-# ${r.category || 'event'} · ${calWhen(r)} · *${V.origin(r)}*${orphan ? `\n-# ${emojis.warn} No staged draw by this name: /draws will not list it after Promote.` : ''}`)], accessory: btn(['dcedit', key], 'Edit', emojis.edit) });
    }
    if (pages > 1) components.push(row(arrow(['dc', pg - 1], 'left', pg === 0), counter(['dcpg'], `Page ${pg + 1} / ${pages}`), arrow(['dc', pg + 1], 'right', pg === pages - 1)));
    components.push(BIG());
    if (extraRow) components.push(extraRow);
    components.push(row(btn('dcadd', 'Add Entry', emojis.mngAdd, 3), btn(['dcrm', pg], 'Remove Entries', emojis.deleteBin, 4, !all.length), btn('cal', 'Paste Calendar', emojis.pasteImport), btn('dbn', 'Banners', emojis.calendar), btn(['view', 'draft'], 'Back', emojis.returnArrow)));
    return panel(components);
}
function calendarRemoveModal(doc, page = 0) {
    const all = sortedCal(doc);
    const from = Math.min(Math.max(Number(page) || 0, 0) * DC_PER_PAGE, Math.max(0, all.length - 25));
    const pick = all.slice(from, from + 25);
    return { title: 'Remove Draft Calendar Rows', custom_id: V.ID('dcrmm'), components: [{ type: 18, label: 'Rows to remove', description: 'Revert brings them back.', component: require('../../../utils/formChoice').asChoice({ type: 3, custom_id: 'pick', required: true, min_values: 1, max_values: Math.max(1, pick.length), options: pick.map(({ r, key }) => ({ label: String(r.title || '(untitled)').slice(0, 100), value: key, description: `${r.category || 'event'} · ${r.date ? new Date(r.date).toISOString().slice(0, 10) : 'no date'}`.slice(0, 100) })) }) }] };
}
// One row from the Add / Edit pop-up (commands/manage.js's calendar boxes: title, start_date, end_date, category, double_cp). Blank end = All Season; TBD = no end yet, as the live calendar box reads it.
function rowFromFields(interaction) {
    const { parseAdminDate, normalizeCalendarCategory } = require('../../../utils/adminParser');
    const title = field(interaction, 'title').trim();
    const start = parseAdminDate(field(interaction, 'start_date').trim());
    const endRaw = field(interaction, 'end_date').trim();
    const ongoing = !endRaw;
    const tbd = /^(tbd|tba)\.?$/i.test(endRaw);
    const end = ongoing || tbd ? null : parseAdminDate(endRaw);
    const errors = [!title && 'a title', !start && `a start date I can read ("${field(interaction, 'start_date').trim()}")`, !ongoing && !tbd && !end && `an end date I can read ("${endRaw}"), All Season (blank) or TBD`].filter(Boolean);
    if (errors.length) return { error: `Needs ${errors.join(', ')}.` };
    return { row: { title, date: start, endDate: end, isOngoing: ongoing, category: normalizeCalendarCategory(field(interaction, 'category'), title), isDoubleCP: /^y/i.test(field(interaction, 'double_cp').trim()) } };
}

// ---------- one draft draw ----------
const SEC = { n: { key: 'newDraws', label: 'New Draws', other: 'r' }, r: { key: 'returningDraws', label: 'Returning Draws', other: 'n' } };
function drawCardView(doc, sec, id, note = null, extraRow = null) {
    const s = SEC[sec] ? sec : 'n';
    const draw = (doc?.draft?.[SEC[s].key] || []).find(x => String(x._id) === String(id));
    if (!draw) return V.draftDrawsView(doc, s, 0, `${emojis.cross} That draw is no longer staged.`);
    const { endRowFor } = require('../../../utils/draftPaste');
    const cal = endRowFor(doc?.draft, draw.title);
    const end = cal ? (cal.isOngoing ? 'All Season' : cal.endDate ? `<t:${unix(cal.endDate)}:f> · <t:${unix(cal.endDate)}:R>` : 'TBD') : 'not set';
    const items = (draw.items || []).map(i => (i.tier === 'comment' ? `-# ${i.name}` : `${emojis[i.tier] ? `${emojis[i.tier]} ` : ''}${i.name}`));
    const typeName = draw.priceType ? (require('../../../utils/drawTypes').drawTypeName?.(draw.priceType) || draw.priceType) : 'not set';
    const body = `${crumb('Next Season Draft', SEC[s].label)}\n## ${s === 'n' ? emojis.newDraws : emojis.returningDraws} ${draw.title || '(untitled)'}\n**Starts** ${draw.date ? `<t:${unix(draw.date)}:f>` : 'no date'}\n**Ends** ${end}\n-# Draw type: ${typeName} · *${V.origin(draw)}*${draw.thumbnailUrl ? '' : ` · ${emojis.warn} no picture`}`;
    const components = [draw.thumbnailUrl ? { type: 9, components: [text(body)], accessory: { type: 11, media: { url: draw.thumbnailUrl } } } : text(body)];
    if (note) components.push(SMALL(), text(note));
    components.push(SMALL(), text((items.length ? items.join('\n') : `${emojis.warn} No items.`).slice(0, 2500)), BIG());
    if (extraRow) components.push(extraRow);
    components.push(row(
        btn(['ddedit', s, String(draw._id)], 'Edit', emojis.edit, 1),
        btn(['ddend', s, String(draw._id)], cal?.endDate ? 'Change End Date' : 'Set End Date', emojis.calendar),
        btn(['ddmv', s, String(draw._id)], `Move to ${s === 'n' ? 'Returning' : 'New'}`, s === 'n' ? emojis.returningDraws : emojis.newDraws),
        btn(['ddrm1', s, String(draw._id)], 'Remove', emojis.deleteBin, 4),
        btn(['dd', s, 0], 'Back', emojis.returnArrow),
    ));
    return panel(components);
}
function drawEndModal(sec, draw, cal) {
    const { formatAdminDate } = require('../../../utils/adminParser');
    const value = cal?.endDate ? formatAdminDate(cal.endDate) : cal && !cal.isOngoing ? 'TBD' : '';
    return { title: 'Draft Draw: End Date', custom_id: V.ID('ddendm', sec, String(draw._id)), components: [{ type: 18, label: 'End date (blank or TBD = not known yet)', description: String(draw.title || '').slice(0, 100), component: { type: 4, custom_id: 'end', style: 1, required: false, placeholder: 'e.g. December 3', ...(value ? { value } : {}) } }] };
}
function bannersModal(doc) {
    const d = doc?.draft || {};
    const box = (id, label, value) => ({ type: 18, label, component: { type: 4, custom_id: id, style: 1, required: false, placeholder: 'https://… (blank = none)', ...(value ? { value: String(value).slice(0, 4000) } : {}) } });
    return { title: 'Draft: /calendar Page Banners', custom_id: V.ID('dbnm'), components: [box('draws', 'Draws page banner', d.drawsBannerUrl), box('events', 'Events page banner', d.eventsBannerUrl), box('playlists', 'Playlists page banner', d.playlistsBannerUrl)] };
}

// ---------- writes ----------
const commit = (ops, actorId) => require('../../../core/changeset').commitSet(ops, { actorId });
const failNote = (r) => `### ${emojis.cross} Not saved\n${(r.failures || []).map(f => (f.errors || []).join(' ')).join(' ') || (r.failedAt?.errors || []).join(' ') || require('../shared').extractCommitError?.(r) || 'Try again.'}`.slice(0, 1800);

// ---------- routing ---------- TRUE when the verb was this module's. `ctx` is ./index.js's: { gate, ack, show, say, getDoc, home, revertButton }.
async function route(interaction, verb, a, b, ctx) {
    const { gate, ack, show, say, getDoc, home, revertButton } = ctx;
    const user = interaction.user.id;
    const isSubmit = interaction.isModalSubmit?.();
    const revertRow = (r) => (r.ok && r.changeIds?.length ? row(...revertButton(r.changeIds, 'd')) : null);

    // ----- Paste Draws -----
    if (verb === 'dr' && !isSubmit) { if (await gate(interaction, 'bulkdraws')) await interaction.showModal(drawsBox()); return true; }
    if (verb === 'drm' && isSubmit) {
        if (!(await gate(interaction, 'bulkdraws'))) return true;
        await ack(interaction);
        const newText = field(interaction, 'new_text').trim(), retText = field(interaction, 'returning_text').trim();
        const plan = require('../../../utils/draftPaste').planDraws((await getDoc())?.draft || {}, newText, retText);
        await show(interaction, drawsPreview(plan, keepPaste(user, { kind: 'draws', newText, retText })));
        return true;
    }
    if (verb === 'dpe') {
        if (!(await gate(interaction, 'bulkdraws'))) return true;
        const p = pasteFor(a, user);
        await interaction.showModal(drawsBox(p ? { new_text: p.newText, returning_text: p.retText } : {}));
        return true;
    }
    if (verb === 'dps') {
        if (!(await gate(interaction, 'bulkdraws'))) return true;
        const p = pasteFor(a, user);
        if (!p) { if (PASTES.has(String(a))) { await say(interaction, `${emojis.cross} That paste is someone else's. Paste your own with Paste Draws.`); return true; } await show(interaction, V.draftDrawsView(await getDoc(), 'n', 0, `${emojis.cross} That paste has expired (they last 30 minutes). Paste it again.`)); return true; }
        await ack(interaction);
        // Planned again against the draft as it is now, so a row staged since the preview is matched rather than added twice.
        const r = await require('../season').saveDraftDraws(user, p.newText, p.retText);
        if (r.ok) PASTES.delete(String(a));
        const sec = r.plan?.added?.[0]?.sec === 'returning' || (!r.plan?.added?.length && r.plan?.changed?.[0]?.sec === 'returning') ? 'r' : 'n';
        const out = V.draftDrawsView(await getDoc(), sec, 0, r.ok ? `### ${emojis.checkmark} Staged\n${r.message.replace(/^\*\*Draft Draws Staged!\*\* /, '')}`.slice(0, 1800) : `### ${emojis.cross} Not staged\n${r.message}`.slice(0, 1800));
        if (r.ok) out[0].components.splice(out[0].components.length - 1, 0, row(...revertButton(r.changeIds, 'd')));
        const sent = await show(interaction, out);
        if (r.ok && r.titles?.length) await require('../itemKinds').askItemKinds(interaction, r.titles);
        return sent || true;
    }

    // ----- Paste Calendar ----- (`cal` is Paste Calendar's button everywhere on the draft)
    if (verb === 'cal' && !isSubmit) { if (await gate(interaction, 'bulkcalendar')) await interaction.showModal(calendarBox()); return true; }
    if (verb === 'calm' && isSubmit) {
        if (!(await gate(interaction, 'bulkcalendar'))) return true;
        await ack(interaction);
        const raw = field(interaction, 'bulk_text');
        const plan = require('../../../utils/draftPaste').planCalendar((await getDoc())?.draft || {}, raw);
        await show(interaction, calendarPreview(plan, keepPaste(user, { kind: 'calendar', text: raw })));
        return true;
    }
    if (verb === 'cpe') {
        if (!(await gate(interaction, 'bulkcalendar'))) return true;
        const p = pasteFor(a, user);
        await interaction.showModal(calendarBox(p ? { bulk_text: p.text } : {}));
        return true;
    }
    if (verb === 'cps') {
        if (!(await gate(interaction, 'bulkcalendar'))) return true;
        const p = pasteFor(a, user);
        if (!p) { if (PASTES.has(String(a))) { await say(interaction, `${emojis.cross} That paste is someone else's. Paste your own with Paste Calendar.`); return true; } await show(interaction, draftCalendarView(await getDoc(), 0, `${emojis.cross} That paste has expired (they last 30 minutes). Paste it again.`)); return true; }
        await ack(interaction);
        const r = await require('../season').saveDraftCalendar(user, p.text);
        if (r.ok) PASTES.delete(String(a));
        await show(interaction, draftCalendarView(await getDoc(), 0, r.ok ? `### ${emojis.checkmark} Staged\n${r.message.replace(/^\*\*Draft Calendar Staged!\*\* /, '')}`.slice(0, 1800) : `### ${emojis.cross} Not staged\n${r.message}`.slice(0, 1800), revertRow(r)));
        return true;
    }

    // ----- the draft calendar, one row at a time -----
    if (verb === 'dc') { await show(interaction, draftCalendarView(await getDoc(), Number(a) || 0)); return true; }
    if (verb === 'dcadd') { if (await gate(interaction, 'bulkcalendar')) await interaction.showModal(reId(manage().buildCalendarAddModal(), V.ID('dcaddm'), 'Add a Draft Calendar Row')); return true; }
    if (verb === 'dcedit') {
        if (!(await gate(interaction, 'bulkcalendar'))) return true;
        const doc = await getDoc();
        const hit = findRow(doc?.draft?.calendar || [], a);
        if (!hit) { await show(interaction, draftCalendarView(doc, 0, `${emojis.cross} That row is no longer staged.`)); return true; }
        await interaction.showModal(reId(manage().buildEditCalendarModal(hit.row, 'x'), V.ID('dceditm', a), 'Edit a Draft Calendar Row'));
        return true;
    }
    if (verb === 'dcrm') { if (await gate(interaction, 'bulkcalendar')) await interaction.showModal(calendarRemoveModal(await getDoc(), Number(a) || 0)); return true; }
    if ((verb === 'dcaddm' || verb === 'dceditm' || verb === 'dcrmm') && isSubmit) {
        if (!(await gate(interaction, 'bulkcalendar'))) return true;
        await ack(interaction);
        const doc = await getDoc();
        const calendar = [...(doc?.draft?.calendar || [])];
        let next, label;
        if (verb === 'dcrmm') {
            let keys = [];
            try { keys = require('../../../utils/formChoice').readChoice(interaction, 'pick'); } catch { keys = []; }
            const gone = new Set(keys.map(k => findRow(calendar, k)?.index).filter(i => i !== undefined));
            next = calendar.filter((_, i) => !gone.has(i));
            label = `Removed ${plural(gone.size, 'row')}`;
            if (!gone.size) { await show(interaction, draftCalendarView(doc, 0, `${emojis.cross} Nothing was removed: those rows are no longer staged.`)); return true; }
        } else {
            const got = rowFromFields(interaction);
            if (got.error) { await show(interaction, draftCalendarView(doc, 0, `### ${emojis.cross} Not saved\n${got.error}`)); return true; }
            if (verb === 'dceditm') {
                const hit = findRow(calendar, a);
                if (!hit) { await show(interaction, draftCalendarView(doc, 0, `${emojis.cross} That row is no longer staged.`)); return true; }
                // The row keeps its _id and news tag, so it reads "news, edited by you" and news triage leaves it alone.
                next = calendar.map((r, i) => (i === hit.index ? { ...r, ...got.row } : r));
                label = `Saved ${got.row.title}`;
            } else {
                const { isSameDrawTitle } = require('../../../utils/search');
                const twin = calendar.find(r => r.category === got.row.category && (String(r.title).trim().toLowerCase() === got.row.title.toLowerCase() || (r.category === 'draw' && isSameDrawTitle(r.title, got.row.title))));
                if (twin) { await show(interaction, draftCalendarView(doc, 0, `### ${emojis.cross} Not saved: ${twin.title} is already staged\nUse its Edit instead.`)); return true; }
                next = [...calendar, got.row];
                label = `Added ${got.row.title}`;
            }
        }
        next.sort((x, y) => new Date(x.date || 0) - new Date(y.date || 0));
        const r = await commit([{ type: 'season.bulkDraftCalendar', payload: { parsed: next } }], user);
        await show(interaction, draftCalendarView(await getDoc(), 0, r.ok ? `### ${emojis.checkmark} ${label}\n-# Staged, not live.` : failNote(r), revertRow(r)));
        return true;
    }

    // ----- one draft draw's card -----
    if (verb === 'ddc') { await show(interaction, drawCardView(await getDoc(), a, b)); return true; }
    if (verb === 'ddend' && !isSubmit) {
        if (!(await gate(interaction, 'bulkdraws'))) return true;
        const doc = await getDoc();
        const draw = (doc?.draft?.[SEC[a]?.key || 'newDraws'] || []).find(x => String(x._id) === String(b));
        if (!draw) { await show(interaction, V.draftDrawsView(doc, a, 0, `${emojis.cross} That draw is no longer staged.`)); return true; }
        await interaction.showModal(drawEndModal(SEC[a] ? a : 'n', draw, require('../../../utils/draftPaste').endRowFor(doc?.draft, draw.title)));
        return true;
    }
    if (verb === 'ddendm' && isSubmit) {
        if (!(await gate(interaction, 'bulkdraws'))) return true;
        await ack(interaction);
        const doc = await getDoc();
        const s = SEC[a] ? a : 'n';
        const draw = (doc?.draft?.[SEC[s].key] || []).find(x => String(x._id) === String(b));
        if (!draw) { await show(interaction, V.draftDrawsView(doc, s, 0, `${emojis.cross} That draw is no longer staged.`)); return true; }
        const raw = field(interaction, 'end').trim();
        const known = raw && !/^(tbd|tba)\.?$/i.test(raw);
        const end = known ? require('../../../utils/adminParser').parseAdminDate(raw) : null;
        if (known && !end) { await show(interaction, drawCardView(doc, s, b, `### ${emojis.cross} Not saved\nI could not read "${raw}" as a date. Try one like December 3, or leave it blank.`)); return true; }
        const { endRowFor } = require('../../../utils/draftPaste');
        const calendar = [...(doc?.draft?.calendar || [])];
        const cal = endRowFor(doc?.draft, draw.title);
        if (!cal && !end) { await show(interaction, drawCardView(doc, s, b, `-# Nothing to change: it has no end date yet.`)); return true; }
        const event = { title: cal?.title || draw.title, date: cal?.date || draw.date, endDate: end, isOngoing: false, category: 'draw', isDoubleCP: Boolean(cal?.isDoubleCP) };
        const next = (cal ? calendar.map(c => (c === cal ? { ...c, ...event } : c)) : [...calendar, event]).sort((x, y) => new Date(x.date || 0) - new Date(y.date || 0));
        const r = await commit([{ type: 'season.bulkDraftCalendar', payload: { parsed: next } }], user);
        await show(interaction, drawCardView(await getDoc(), s, b, r.ok ? `### ${emojis.checkmark} ${end ? `Ends <t:${unix(end)}:D>` : 'End date cleared'}\n-# On the draft calendar's draw row, as /draws reads it. Staged, not live.` : failNote(r), revertRow(r)));
        return true;
    }
    if (verb === 'ddmv' || verb === 'ddrm1') {
        if (!(await gate(interaction, 'bulkdraws'))) return true;
        await ack(interaction);
        const doc = await getDoc();
        const s = SEC[a] ? a : 'n';
        const from = [...(doc?.draft?.[SEC[s].key] || [])];
        const draw = from.find(x => String(x._id) === String(b));
        if (!draw) { await show(interaction, V.draftDrawsView(doc, s, 0, `${emojis.cross} That draw is no longer staged.`)); return true; }
        const DD = require('../../../utils/draftDraws');
        const lists = { [SEC[s].key]: from.filter(x => x !== draw) };
        if (verb === 'ddmv') lists[SEC[SEC[s].other].key] = DD.addDraw(doc?.draft?.[SEC[SEC[s].other].key] || [], draw);
        const r = await commit([{ type: 'season.bulkDraftDraws', payload: { parsed: lists } }], user);
        if (!r.ok) { await show(interaction, drawCardView(doc, s, b, failNote(r))); return true; }
        if (verb === 'ddmv') { await show(interaction, drawCardView(await getDoc(), SEC[s].other, b, `### ${emojis.checkmark} Moved to ${SEC[SEC[s].other].label}\n-# Staged, not live.`, revertRow(r))); return true; }
        const carried = draw.newsSource?.carried ? `\n${emojis.warn} It is still running when the season starts, so the daily carry-over adds it back. To drop it for good, end it before the season on the live calendar.` : '';
        const out = V.draftDrawsView(await getDoc(), s, 0, `### ${emojis.checkmark} Removed ${draw.title}\n-# Staged, not live.${carried}`);
        out[0].components.splice(out[0].components.length - 1, 0, row(...revertButton(r.changeIds, 'd')));
        await show(interaction, out);
        return true;
    }

    // ----- the draft's banners -----
    if (verb === 'dbn' && !isSubmit) { if (await gate(interaction, 'bulkcalendar')) await interaction.showModal(bannersModal(await getDoc())); return true; }
    if (verb === 'dbnm' && isSubmit) {
        if (!(await gate(interaction, 'bulkcalendar'))) return true;
        await ack(interaction);
        const payload = { draws: field(interaction, 'draws').trim(), events: field(interaction, 'events').trim(), playlists: field(interaction, 'playlists').trim() };
        const r = await commit([{ type: 'season.setDraftBanners', payload }], user);
        const set = Object.entries(payload).filter(([, v]) => v).map(([k]) => k);
        const note = r.ok ? `### ${emojis.checkmark} Banners staged\n-# ${set.length ? `Set: ${set.join(', ')}.` : 'All three are blank.'} They replace /calendar's banners at Promote to Live; blank ones leave the live banner as it is.` : failNote(r);
        const out = await home('draft', await getDoc(), note, interaction);
        if (r.ok && r.changeIds?.length) out[0].components.push(row(...revertButton(r.changeIds, 'd')));
        await show(interaction, out);
        return true;
    }
    return false;
}

module.exports = { route, drawsPreview, calendarPreview, draftCalendarView, calendarRemoveModal, drawCardView, drawEndModal, bannersModal, keepPaste, pasteFor, PASTES };
