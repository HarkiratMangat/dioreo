// handlers/manage/quickAdd.js -- /manage draws' Quick Add (2026-11-01, Harkirat: "the button would open a large text field form, where I just type the draw name or item name (plus a start and/or end date. One per line ... The bot then checks the database/catalogue for that stored draw. It then grabs all the info and drafts a confirmation screen, along with an edit button for each draw in the draft incase I want to correct or add or override anything. And upon confirmation it adds it to the draws command pages and the calendar.").
//
// THE FLOW: the Quick Add button opens one box (commands/manage.js buildQuickAddModal) -> each line is read and matched in the draw index (utils/quickAdd.js) -> a DRAFT panel, one row per draw with its own Edit button -> Save writes every draw in ONE commitSet: draw.add for a draw not on /draws yet, and a /calendar draw row (calendar.add, or calendar.edit when the draw already has one) for every draw given an end date. A draw already on /draws is not added twice: its line sets its end date, and moves its start only when the line gives one.
//
// THE DRAFT lives in memory (DRAFTS below), keyed by a short token in every custom_id, for DRAFT_TTL_MS. A restart or the timeout drops it and its buttons answer "start again"; nothing is written until Save, so losing a draft loses no data.
//
// PICK (his ask, 2026-11-01 11:50 EDT: "will it ask me for confirmation to pick from a dropdown list"): a draw the words only guess at, or only describe ("mythic character"), gets a Pick button in place of Edit. It opens a dropdown of up to 24 draws from the index plus "keep as typed"; the pick replaces the row and the row's button turns back into Edit. A row still waiting for a pick is skipped on Save.
//
// custom_ids: modal_draws_quickadd · mng_qa_edit_<token>_<i> · modal_qa_edit_<token>_<i> · mng_qa_pick_<token>_<i> · modal_qa_pick_<token>_<i> · mng_qa_save_<token> · mng_qa_cancel_<token> · mng_qa_revert_<token> (after Save). The router's /manage lock runs on the `mng_` and `modal_` prefixes first; commitSet checks the admin's tiers again on Save (draws create, and calendar create for an end date).
const { randomBytes } = require('crypto');
const { ModalBuilder, LabelBuilder, StringSelectMenuBuilder } = require('discord.js');
const BOT_EMOJI = require('../../utils/emojiMap');
const emojis = require('../../utils/emojiMap');
const { commitSet } = require('../../core/changeset');
const { sendV2Payload } = require('../../utils/sendV2Payload');
const { resultPanel, notePanel, ACCENT, FAIL_ACCENT } = require('../../utils/managePanels');
const { loadOrCreateSeasonalDoc, extractCommitError } = require('./shared');
const qa = require('../../utils/quickAdd');

const DRAFT_TTL_MS = 30 * 60 * 1000;
const DRAFTS = new Map(); // token -> { userId, drafts, extra, zone, at }
// A saved draft's change ids, for its Revert button. The shared Revert (utils/managePanels.js actionRow) carries the ids in its custom_id, which holds three at most within Discord's 100 characters; one Quick Add saves up to twenty. So the ids stay here, under the draft's token, for the same 30 minutes, and every change stays revertable one by one from /bot analytics after that.
const SAVED = new Map(); // token -> { userId, changeIds, at }

function sweep(now = Date.now()) {
    for (const map of [DRAFTS, SAVED]) for (const [token, d] of map) if (now - d.at > DRAFT_TTL_MS) map.delete(token);
}

function getDraft(token, userId) {
    sweep();
    const d = DRAFTS.get(token);
    return d && d.userId === userId ? d : null;
}

// Every draft line, matched, with a second line naming the same draw marked so Save writes it once.
async function buildDrafts(lines, { zone, now = new Date() }) {
    const { loadCatalog } = require('../../utils/drawCatalog');
    const { isSameDrawTitle } = require('../../utils/search');
    const [entries, seasonalDoc] = await Promise.all([loadCatalog(), loadOrCreateSeasonalDoc()]);
    const drafts = lines.map(line => qa.draftFromLine(qa.parseQuickLine(line, { zone, now }), { entries, seasonalDoc, isSameTitle: isSameDrawTitle, zone, now }));
    markDuplicates(drafts, isSameDrawTitle);
    return drafts;
}

// What Save writes: not a second line for the same draw, not a row still waiting for a pick, and not an already-listed draw the line changes nothing on.
const willWrite = d => d.duplicateOf === null && !d.needsPick && (!d.existing || d.end || d.startGiven);

function markDuplicates(drafts, isSameTitle) {
    drafts.forEach((d, i) => {
        const first = drafts.findIndex((o, j) => j < i && isSameTitle(o.title, d.title));
        d.duplicateOf = first === -1 ? null : first;
    });
}

// ==========================================
// THE DRAFT PANEL
// ==========================================
const stamp = date => `<t:${Math.floor(new Date(date).getTime() / 1000)}:f>`;

function draftLines(d, i) {
    const { drawTypeName } = require('../../utils/drawTypes');
    const kind = drawTypeName(d.priceType || '');
    const head = d.needsPick ? `**${i + 1}. Pick a draw**` : `**${i + 1}. ${d.title}**\n-# ${d.category === 'new' ? 'New' : 'Returning'} draw${kind ? ` · ${kind}` : ''}`;
    const when = `> ${d.existing && !d.startGiven ? 'Started' : 'Starts'} ${stamp(d.start)} · ${d.end ? `ends ${stamp(d.end)}` : 'no end date'}`;
    const shown = (d.items || []).filter(it => it.tier !== 'comment');
    const items = shown.length ? `-# ${shown.length} item${shown.length === 1 ? '' : 's'}: ${shown.slice(0, 2).map(it => it.name).join(', ')}${shown.length > 2 ? ', …' : ''}` : '-# No items';
    const notes = [];
    if (d.duplicateOf !== null && d.duplicateOf !== undefined) notes.push(`${emojis.warn} Same draw as line ${d.duplicateOf + 1}: skipped on Save.`);
    if (d.existing) notes.push(`ℹ️ Already on /draws as **${d.existing.title}**: Save ${[d.end && 'sets its end date', d.startGiven && 'moves its start'].filter(Boolean).join(' and ') || 'changes nothing'}.`);
    if (d.needsPick) notes.push(`${emojis.warn} "${d.query}" fits ${d.candidates.length} draw${d.candidates.length === 1 ? '' : 's'}. Pick one, or it's skipped on Save.`);
    else if (!d.matchedBy && !d.existing && !d.edited) notes.push(`${emojis.warn} Not in the draw index. Add details gives its items and picture, or it's saved as typed.`);
    // Which season the draw index files it under (his question, 2026-11-01 12:55 EDT): a draw new to the index and saved as New gets this season; one the index already has keeps its own, whatever the line says.
    if (d.category === 'new' && !d.existing && !d.matchedBy && d.seasonNow) notes.push(`ℹ️ Goes into the draw index as a Season ${d.seasonNow} draw once it has a picture.`);
    else if (d.category === 'new' && d.indexSeason && d.seasonNow && d.indexSeason !== d.seasonNow) notes.push(`ℹ️ The draw index keeps it as a Season ${d.indexSeason} draw.`);
    else if (d.matchedBy === 'words' && !d.edited) notes.push(d.sure ? `ℹ️ Matched from "${d.query}".` : `${emojis.warn} Best guess for "${d.query}". Pick to choose another.`);
    else if (d.matchedBy === 'alias' && !d.edited) notes.push(`ℹ️ "${d.query}" is another name for this draw.`);
    for (const p of d.problems) notes.push(`${emojis.warn} ${p}`);
    return [head, when, items, ...notes.map(n => `-# ${n}`)].join('\n').slice(0, 900);
}

function draftPanel(token, state) {
    const { drafts, extra } = state;
    const writes = drafts.filter(willWrite).length;
    // Pick while the match is a guess (or there is none yet), Edit once it is settled. Add details for a draw the index doesn't know: the same Edit box, which asks for items and a picture like Add Draw (his ask, 2026-11-01 12:41 EDT).
    const accessory = (d, i) => d.candidates?.length && !d.edited
        ? { type: 2, style: 1, label: 'Pick', custom_id: `mng_qa_pick_${token}_${i}` }
        : !d.matchedBy && !d.existing && !d.edited
            ? { type: 2, style: 1, label: 'Add details', emoji: emojis.parseEmoji(emojis.mngAdd), custom_id: `mng_qa_edit_${token}_${i}` }
            : { type: 2, style: 2, label: 'Edit', emoji: emojis.parseEmoji(emojis.mngEdit), custom_id: `mng_qa_edit_${token}_${i}` };
    const components = [
        { type: 10, content: [`### ${emojis.mngAdd} Quick Add · ${drafts.length} draw${drafts.length === 1 ? '' : 's'}`,
            `-# Check each one and Edit what's wrong. Nothing is saved until Save.`,
            extra ? `-# ${emojis.warn} ${extra} more line${extra === 1 ? '' : 's'} left out: ${qa.MAX_LINES} fit one draft.` : null].filter(Boolean).join('\n') },
        { type: 14, spacing: 1, divider: true },
        ...drafts.map((d, i) => ({
            type: 9,
            components: [{ type: 10, content: draftLines(d, i) }],
            accessory: accessory(d, i)
        })),
        { type: 14, spacing: 1, divider: true },
        { type: 1, components: [
            { type: 2, style: 3, label: writes ? `Save ${writes}` : 'Nothing to save', custom_id: `mng_qa_save_${token}`, disabled: !writes },
            { type: 2, style: 2, label: 'Cancel', custom_id: `mng_qa_cancel_${token}` }
        ] }
    ];
    return [{ type: 17, accent_color: ACCENT.draws, components }];
}

const expiredPanel = () => notePanel(`${BOT_EMOJI.cross} This draft has expired (drafts last 30 minutes, and a restart clears them). Open Quick Add again.`, FAIL_ACCENT);

// ==========================================
// HANDLERS
// ==========================================
// modal_draws_quickadd
async function submitQuickAdd(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const { lines, extra } = qa.parseQuickText(interaction.fields.getTextInputValue('lines'));
    if (!lines.length) return interaction.followUp({ flags: 32768 | 64, components: notePanel(`${BOT_EMOJI.cross} The box was empty. Nothing to add.`, FAIL_ACCENT) });
    const zone = qa.TIME_ZONE;
    const drafts = await buildDrafts(lines, { zone });
    sweep();
    const token = randomBytes(4).toString('hex');
    const state = { userId: interaction.user.id, drafts, extra, zone, at: Date.now() };
    DRAFTS.set(token, state);
    return interaction.followUp({ flags: 32768 | 64, components: draftPanel(token, state) });
}

// The When box's text for a draft: what was read, in a form the reader reads back the same way.
function whenText(d) {
    const fmt = (date, timed) => {
        const iso = new Date(date).toISOString();
        return timed ? `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC` : iso.slice(0, 10);
    };
    return [d.category === 'new' ? 'new' : 'returning', d.startGiven ? `starts ${fmt(d.start, d.startTimed)}` : null, d.end ? `ends ${fmt(d.end, d.endTimed)}` : null].filter(Boolean).join(', ');
}

// mng_qa_edit_<token>_<i> / mng_qa_save_<token> / mng_qa_cancel_<token>
async function handleButton(interaction) {
    const id = interaction.customId;
    const [, , verb, token, index] = id.split('_');
    if (verb === 'revert') {
        sweep();
        const saved = SAVED.get(token);
        if (!saved || saved.userId !== interaction.user.id) return interaction.reply({ content: `${BOT_EMOJI.cross} This Revert has expired (30 minutes, or a restart). Each change can still be reverted from /bot analytics.`, ephemeral: true });
        SAVED.delete(token);
        return require('./results').revertChanges(interaction, saved.changeIds, 'the draws and /calendar rows that Quick Add saved are gone');
    }
    const state = getDraft(token, interaction.user.id);
    if (!state) return sendV2Payload(interaction, expiredPanel());

    if (verb === 'cancel') {
        DRAFTS.delete(token);
        return sendV2Payload(interaction, notePanel('Quick Add cancelled. Nothing was saved.', ACCENT.draws));
    }
    if (verb === 'edit') {
        const i = Number(index);
        const d = state.drafts[i];
        if (!d) return sendV2Payload(interaction, expiredPanel());
        const manage = interaction.client.commands.get('manage');
        return interaction.showModal(manage.buildQuickEditModal(token, i, d, { whenText: whenText(d), itemsText: qa.itemsToText(d.items) }));
    }
    if (verb === 'pick') {
        const i = Number(index);
        const d = state.drafts[i];
        if (!d || !d.candidates?.length) return sendV2Payload(interaction, expiredPanel());
        const { loadCatalog } = require('../../utils/drawCatalog');
        const entries = await loadCatalog();
        return interaction.showModal(buildPickModal(token, i, d, d.candidates.map(slug => entries.find(e => e.slug === slug)).filter(Boolean)));
    }
    if (verb === 'save') return save(interaction, token, state);
    return false;
}

// modal_qa_edit_<token>_<i>: the edited draw replaces its row in the draft, and the draft panel is drawn again in place.
async function submitEdit(interaction) {
    const [, , , token, index] = interaction.customId.split('_');
    const state = getDraft(token, interaction.user.id);
    if (!state || !state.drafts[Number(index)]) return sendV2Payload(interaction, expiredPanel());
    const { parseItemLine } = require('../../utils/adminParser');
    const { isSameDrawTitle } = require('../../utils/search');
    const { loadCatalog, matchByName } = require('../../utils/drawCatalog');
    const i = Number(index);
    const before = state.drafts[i];
    const title = interaction.fields.getTextInputValue('title').trim() || before.title;
    const itemsText = interaction.fields.getTextInputValue('items') || '';
    const when = interaction.fields.getTextInputValue('when') || '';
    let priceType = before.priceType;
    let imageInput = before.imageInput || '';
    try { imageInput = interaction.fields.getTextInputValue('url').trim(); } catch { /* an old box */ }
    try { priceType = interaction.fields.getStringSelectValues('price_type')[0] ?? priceType; } catch { /* an old box */ }

    // The section and the dates, read with the same reader as a Quick Add line, so one wording works in both places. No section word keeps the row's own.
    const parsed = qa.parseQuickLine(`x, ${when}`, { zone: state.zone });
    const category = parsed.category || before.category;
    // A new title the index knows brings that draw's items and picture, unless the items were edited too.
    let items = itemsText.split('\n').filter(l => l.trim()).map(parseItemLine);
    let imageUrl = before.imageUrl, matchedBy = before.matchedBy, indexSeason = before.indexSeason;
    if (title !== before.title) {
        const hit = matchByName(await loadCatalog(), title);
        imageUrl = hit ? hit.entry.imageUrl : null;
        matchedBy = hit ? hit.matchedBy : null;
        indexSeason = hit?.entry.releaseSeason || null;
        if (hit && itemsText.trim() === qa.itemsToText(before.items).trim()) items = qa.drawItemsFromEntry(hit.entry);
        if (hit && priceType === before.priceType && hit.entry.priceType) priceType = hit.entry.priceType;
    }
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const listed = require('../../utils/search').bestDrawMatch(
        [['new', seasonalDoc.newDraws || []], ['returning', seasonalDoc.returningDraws || []]].flatMap(([cat, list]) => list.map(d => ({ cat, d }))),
        title, x => x.d.title);
    state.drafts[i] = {
        ...before,
        title, items, imageUrl: imageInput || imageUrl, imageInput, matchedBy, indexSeason, category: listed ? listed.cat : category, priceType,
        start: parsed.start ? parsed.start.date : listed ? listed.d.date : qa.todayUtc({ zone: state.zone }),
        startGiven: Boolean(parsed.start), startTimed: Boolean(parsed.start?.timed),
        end: parsed.end ? parsed.end.date : null, endTimed: Boolean(parsed.end?.timed),
        existing: listed ? { category: listed.cat, elementId: String(listed.d._id), title: listed.d.title } : null,
        problems: parsed.problems, edited: true, sure: true, alternates: [], candidates: [], needsPick: false
    };
    markDuplicates(state.drafts, isSameDrawTitle);
    state.at = Date.now();
    return sendV2Payload(interaction, draftPanel(token, state));
}

// The Pick box: one dropdown of the draws the line's words fit, the current guess picked, and "keep as typed" last. Discord's limits: 45 characters for a label, 100 for an option's label and description, 25 options.
function buildPickModal(token, index, draft, candidates) {
    const tiers = e => (e.items || []).filter(it => it.tier !== 'comment').slice(0, 2).map(it => it.name).join(', ');
    const options = candidates.slice(0, qa.MAX_CANDIDATES).map(e => ({
        label: e.title.slice(0, 100),
        value: e.slug,
        description: `${e.releaseSeason ? `Season ${e.releaseSeason}${e.releaseYear ? ` ${e.releaseYear}` : ''} · ` : ''}${tiers(e)}`.slice(0, 100) || undefined,
        default: !draft.needsPick && e.title === draft.title
    }));
    options.push({ label: `None of these: keep "${draft.query}" as typed`.slice(0, 100), value: '__typed__' });
    return new ModalBuilder().setCustomId(`modal_qa_pick_${token}_${index}`).setTitle('Pick the Draw').addLabelComponents(
        new LabelBuilder().setLabel(`Which draw is "${draft.query}"?`.slice(0, 45)).setDescription('Newest season first when only a rarity or kind was typed')
            .setStringSelectMenuComponent(new StringSelectMenuBuilder().setCustomId('pick').setRequired(true).setMinValues(1).setMaxValues(1).addOptions(options))
    );
}

// modal_qa_pick_<token>_<i>: the picked draw replaces its row, with the line's own dates, and the draft panel is drawn again in place.
async function submitPick(interaction) {
    const [, , , token, index] = interaction.customId.split('_');
    const state = getDraft(token, interaction.user.id);
    const i = Number(index);
    const before = state?.drafts[i];
    if (!before) return sendV2Payload(interaction, expiredPanel());
    const { loadCatalog } = require('../../utils/drawCatalog');
    const { isSameDrawTitle } = require('../../utils/search');
    const value = interaction.fields.getStringSelectValues('pick')[0];
    const [entries, seasonalDoc] = await Promise.all([loadCatalog(), loadOrCreateSeasonalDoc()]);
    const entry = value === '__typed__' ? null : entries.find(e => e.slug === value);
    if (value !== '__typed__' && !entry) return sendV2Payload(interaction, expiredPanel());
    const parsed = {
        line: before.line, query: before.query, problems: before.problems,
        start: before.startGiven ? { date: before.start, timed: before.startTimed } : null,
        end: before.end ? { date: before.end, timed: before.endTimed } : null
    };
    state.drafts[i] = qa.draftFromLine(parsed, { entries, seasonalDoc, isSameTitle: isSameDrawTitle, zone: state.zone, pick: entry || qa.TYPED });
    markDuplicates(state.drafts, isSameDrawTitle);
    state.at = Date.now();
    return sendV2Payload(interaction, draftPanel(token, state));
}

// mng_qa_save_<token>: one commitSet for the whole draft.
async function save(interaction, token, state) {
    await interaction.deferUpdate();
    const { resolveThumbnail } = require('../../utils/cloudinaryCache');
    const { calendarRowFor } = require('../../utils/drawEndReminder');
    const { isKnownType } = require('../../utils/drawCatalog');
    const { namesDrawType, drawTypeName } = require('../../utils/drawTypes');
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const todo = state.drafts.filter(willWrite);

    // Pictures first, outside the transaction, the way Add Draw does it (handlers/manage/draws.js addDraw): a catalog hit is one memory lookup, anything else asks Cloudinary. A picture typed in Add details is uploaded like Add Draw's Thumbnail URL; blank asks the index, then the cache. A `new` line that the index has never seen is indexed with this season as its release season (utils/drawCatalog.js insertFields); a draw the index knows keeps its own.
    const releaseSeason = qa.seasonNumber(seasonalDoc.currentSeasonTitle);
    const releaseYear = qa.seasonYear(seasonalDoc);
    const thumbs = await Promise.all(todo.map(d => d.existing ? null : resolveThumbnail(d.title, d.imageInput || '', { items: d.items, priceType: d.priceType || '', ...(d.category === 'new' && releaseSeason ? { releaseSeason, ...(releaseYear ? { releaseYear } : {}) } : {}) }).catch(() => ({ url: null }))));
    const ops = [];
    const typesFilled = [];
    todo.forEach((d, n) => {
        const all = [...(seasonalDoc.newDraws || []).map(x => ['new', x]), ...(seasonalDoc.returningDraws || []).map(x => ['returning', x])];
        const live = d.existing ? all.find(([, x]) => String(x._id) === d.existing.elementId) : null;
        if (!d.existing) {
            let priceType = d.priceType || '';
            if (!isKnownType(priceType) && namesDrawType(thumbs[n]?.catalog?.priceType)) { priceType = thumbs[n].catalog.priceType; typesFilled.push(`${d.title}: ${drawTypeName(priceType)}`); }
            ops.push({ type: 'draw.add', payload: { title: d.title, items: d.items || [], date: d.start, thumbnailUrl: thumbs[n]?.url || d.imageUrl || null, ...(priceType ? { priceType } : {}), category: d.category } });
        } else if (d.startGiven && live && new Date(live[1].date).getTime() !== new Date(d.start).getTime()) {
            // draw.edit sets every field it is given and validate() fills a missing `items` with [], so the draw's own title and items ride along unchanged.
            ops.push({ type: 'draw.edit', target: { elementId: d.existing.elementId, category: live[0] }, payload: { title: live[1].title, items: live[1].items || [], date: d.start } });
        }
        const row = calendarRowFor(seasonalDoc, d.existing?.title || d.title);
        if (d.end) {
            const event = { title: row?.title || d.title, date: d.startGiven || !row ? d.start : new Date(row.date), endDate: d.end, isOngoing: false, category: 'draw', isDoubleCP: Boolean(row?.isDoubleCP) };
            ops.push(row ? { type: 'calendar.edit', target: { elementId: String(row._id) }, payload: event } : { type: 'calendar.add', payload: event });
        } else if (row && d.startGiven) {
            ops.push({ type: 'calendar.edit', target: { elementId: String(row._id) }, payload: { title: row.title, date: d.start, endDate: row.endDate || null, isOngoing: Boolean(row.isOngoing), category: 'draw', isDoubleCP: Boolean(row.isDoubleCP) } });
        }
    });
    if (!ops.length) return sendV2Payload(interaction, notePanel('Nothing in this draft changes anything.', ACCENT.draws));

    const result = await commitSet(ops, { actorId: interaction.user.id });
    if (!result.ok) {
        const why = result.failures?.map(f => f.errors.join(' ')).join(' ') || extractCommitError(result);
        // The draft stays, so Edit can fix what failed and Save can try again.
        return interaction.followUp({ flags: 32768 | 64, components: notePanel(`${BOT_EMOJI.cross} Nothing was saved: ${why}`, FAIL_ACCENT) });
    }
    DRAFTS.delete(token);
    SAVED.set(token, { userId: interaction.user.id, changeIds: result.changeIds, at: Date.now() });
    const added = todo.filter(d => !d.existing);
    const updated = todo.filter(d => d.existing);
    const sections = [
        { head: `Added to /draws (${added.length})`, lines: added.map(d => `- ${d.title} · ${d.category === 'new' ? 'New' : 'Returning'} · starts ${stamp(d.start)}${d.end ? `, ends ${stamp(d.end)}` : ''}`) },
        { head: `Updated (${updated.length})`, lines: updated.map(d => `- ${d.existing.title}${d.startGiven ? ` · starts ${stamp(d.start)}` : ''}${d.end ? ` · ends ${stamp(d.end)}` : ''}`) },
        { head: 'Draw type from the draw index', lines: typesFilled.map(t => `- ${t}`) }
    ];
    const ends = todo.filter(d => d.end).length;
    const panel = resultPanel({ page: 'draws', heading: 'Quick Add saved', summary: ends ? `-# ${ends} end date${ends === 1 ? '' : 's'} on /calendar too.` : null, sections });
    panel[0].components.push({ type: 14, spacing: 1, divider: false }, { type: 1, components: [{ type: 2, style: 4, label: 'Revert all', custom_id: `mng_qa_revert_${token}` }] });
    const sent = await sendV2Payload(interaction, panel);
    // Items the draw index has no kind for are asked about, not left blank (handlers/manage/itemKinds.js).
    await require('./itemKinds').askItemKinds(interaction, added.map(d => d.title));
    return sent;
}

module.exports = { submitQuickAdd, handleButton, submitEdit, submitPick, buildPickModal, draftPanel, whenText, DRAFTS, SAVED, DRAFT_TTL_MS };
