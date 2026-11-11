// ==========================================
// /manage — DRAWS PAGE
// ==========================================
// Every DB-mutating operation the Draws page reaches: single add/edit, bulk add/replace/delete, and purge. Split out of the former handlers/manage.js on 2026-08-14 (stage 2 of docs/superpowers/specs/2026-08-14-manage-slash-decomposition-design.md) -- dispatched from handlers/manage/index.js, which owns the customId parsing and the generic confirm/cancel glue. See handlers/manage/shared.js for thumbnailNote/resolveThumbnailsForDraws/extractCommitError/loadOrCreateSeasonalDoc, all shared with calendar.js/season.js -- the old in-memory Undo mechanism that also used to live there was retired in plan 2 Task 7.
//
// ⚠️ THE CRASH NET IS THE ROUTER'S. Every function here is awaited from inside handlers/router.js's single top-level try/catch (via handlers/manage/index.js) -- do NOT add a try/catch here that swallows, and keep every error-branch reply an AWAITED call. See .claude/rules/interaction-router.md.
//
// ⚠️ MUTATIONS ROUTE THROUGH THE OPERATION CORE (core/changeset.js's commitSet), as of the portal operation core (plan 1 Task 6, 2026-08-20 23:51 EDT). Every mutation body below used to read the document, mutate it in memory, .save() it, then call utils/changeStore.js's recordChange() -- that write path still exists (utils/changeStore.js) but this page no longer calls it directly. commitSet() applies the op transactionally, records the ChangeLog row itself with an `inverse`, and returns the changeId. Undo for draws-page changes now lives on /bot analytics' Changes page (core/revert.js, Task 7) instead of the inline Undo button that used to render here -- that mechanism is simply GONE from this file, not replaced. Modal parsing and reply formatting are UNTOUCHED; only the mutate+audit section of each function changed. See core/ops/draws.js for the op contract, and its own header for two real defects (bulkReplace's merge semantics, and the bulk-parse payload shape) found and fixed during this exact integration pass.

const BOT_EMOJI = require('../../utils/emojiMap'); // the bot's own status glyphs, read when the message is sent (bot-wide glyph sweep, 2026-10-20 12:49 EDT)
const { resolveThumbnail } = require('../../utils/cloudinaryCache');
const { commitSet } = require('../../core/changeset');
const {
    thumbnailNote, loadOrCreateSeasonalDoc, registerBulkDelete, extractCommitError, humanCommitError
} = require('./shared');
const { failWithRetry } = require('./retry');
const { drawPanel, resultPanel, notePanel, FAIL_ACCENT, ACCENT } = require('../../utils/managePanels');

// The draw's /calendar row write rides in the draw's own commit, so a draws-only admin (no Calendar tier) had the WHOLE commit refused: they could no longer rename a draw or move its date once it had a row, which they could before #249 (lead review, 2026-11-04 09:26 EST). The row write is checked first and, when refused, dropped with a warning, the way Add and Replace Multiple already treat it. Typing an end still needs the Calendar tier (the lead's call, kept).
async function gateEndOp(actorId, endOp) {
    if (!endOp) return { endOp: null, warnings: [] };
    const gate = await require('../../core/changeset').checkOps(actorId, [endOp]);
    if (gate.ok) return { endOp, warnings: [] };
    return { endOp: null, warnings: ['The draw was saved, but its /calendar row (its end date, and its title or start when those changed) was not: that needs the Calendar permission.'] };
}

// --- SAVE NEW SINGLE DRAW --- custom_id: add_draw_{new|returning} `opts.customId` names the section when the pop-up carried the draws panel's own id, and `opts.quiet` returns the saved draw instead of posting it, so the panel can show it in place (2026-11-10 11:19 EST). Every other caller is unchanged.
async function addDraw(interaction, opts = {}) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ ephemeral: true });
    const { toTitleCase, parseItemLine } = require('../../utils/adminParser');
    const customId = opts.customId || interaction.customId;
    const drawType = customId.replace('add_draw_', '');

    // The 5th field is the Draw Type dropdown since 2026-10-18 11:09 EDT (Harkirat's pick, "B sounds fine"); the "Or Paste As One Line" field it replaced lives on as Add Multiple, which takes the same line format and the same `type:` tag. The Draw box (title, dates, a season for a new draw) and the screenshot, read by utils/drawForm.js (2026-11-11 11:02 EST).
    const form = require('../../utils/drawForm').readDrawFields(interaction, { allowSeason: drawType === 'new' });
    if (form.error) return await failWithRetry(interaction, form.error);
    const title = toTitleCase(form.title);
    const dateStr = form.dateStr;
    const rawUrl = form.rawUrl;
    const rawItems = form.rawItems;
    let priceType = '';
    try { priceType = require('../../utils/formChoice').readChoice(interaction, 'price_type')[0] || ''; } catch { priceType = ''; }

    if (!title || !dateStr || !rawItems) {
        return await failWithRetry(interaction, 'Fill in Title, Items, and Release Date.');
    }
    // "Start - End" like the season titles box (utils/drawDates.js): the start is the release date, an end also goes onto the draw's /calendar row, in the same commit.
    const { parseDrawDates, planEndRow } = require('../../utils/drawDates');
    const dates = parseDrawDates(dateStr);
    if (!dates.ok) return await failWithRetry(interaction, dates.error);
    const parsedSingleDate = dates.start;
    // A draw is New or Returning, never both, and never twice in one list: a title either list already holds would show twice on /draws and share one /calendar row. Refused before any picture is looked up, with Try Again, the rule Move keeps (2026-11-10 15:50 EST, click test: Add Returning took "Sapphire Winter Draw" while New Draws had it).
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const { isSameDrawTitle } = require('../../utils/search');
    const twinNew = (seasonalDoc.newDraws || []).find(x => isSameDrawTitle(x.title, title));
    const twin = twinNew || (seasonalDoc.returningDraws || []).find(x => isSameDrawTitle(x.title, title));
    if (twin) return await failWithRetry(interaction, `${twinNew ? 'New' : 'Returning'} Draws already has ${twin.title}. Edit that one, or delete it first; nothing was added.`);

    // URL is optional -- blank reuses a Cloudinary cache hit for this exact title if one exists. No URL AND no cache hit used to hard-reject the whole submission -- relaxed 2026-08-22 19:40 EDT (click-test fix): a draw's info is sometimes known before any image exists to link/cache. thumbnailUrl has no `required` on the schema (models/SeasonalData.js) -- this was purely an app-level choice. commands/draws.js's render renders a plain no-image row instead of a broken thumbnail when thumbnailUrl is null. The items go along so a draw that comes back under a new name finds its old image by what it contains (utils/cloudinaryCache.js).
    const parsedItems = rawItems.split('\n').filter(l => l.trim().length > 0).map(parseItemLine);
    // A draw added to New that the draw index has never seen is indexed with this season as its release season (utils/drawCatalog.js insertFields). A season named in the Draw box wins; otherwise a new draw is this season's.
    const releaseSeason = drawType === 'new' ? (form.season || require('../../utils/quickAdd').seasonNumber(seasonalDoc.currentSeasonTitle)) : null;
    // The year is this season's, so it is left off a season typed in the box that is not this one ("Season 7" is not Season 7 of this year).
    const typedOther = form.season && form.season !== require('../../utils/quickAdd').seasonNumber(seasonalDoc.currentSeasonTitle);
    const releaseYear = typedOther ? null : require('../../utils/quickAdd').seasonYear(seasonalDoc);
    const thumbResult = await resolveThumbnail(title, rawUrl, { items: parsedItems, priceType, ...(releaseSeason ? { releaseSeason, ...(releaseYear ? { releaseYear } : {}) } : {}) });

    // No type picked, or Unsure: the draw index's type when it knows this draw for certain (its title, another name, or its items). Said in a note, so a wrong one is seen and edited.
    const { isKnownType } = require('../../utils/drawCatalog');
    const { namesDrawType, drawTypeName } = require('../../utils/drawTypes');
    let typeNote = null;
    if (!isKnownType(priceType) && namesDrawType(thumbResult.catalog?.priceType)) {
        priceType = thumbResult.catalog.priceType;
        typeNote = `${BOT_EMOJI.info} Draw Type set from the draw index: ${drawTypeName(priceType)}`;
    }

    const newDrawObj = { title, items: parsedItems, date: parsedSingleDate, thumbnailUrl: thumbResult.url, ...(priceType ? { priceType } : {}) };

    // A calendar row for this title may already exist (an event added ahead of the draw): it is edited, never duplicated, and only when an end is typed.
    const row = require('../../utils/drawEndReminder').calendarRowFor(seasonalDoc, title);
    const { endOp, warnings } = await gateEndOp(interaction.user.id, planEndRow({ row, title, start: parsedSingleDate, end: dates.end }));
    const result = await commitSet(
        [{ type: 'draw.add', payload: { ...newDrawObj, category: drawType } }, ...(endOp ? [endOp] : [])],
        { actorId: interaction.user.id }
    );
    if (!result.ok) {
        return await failWithRetry(interaction, extractCommitError(result));
    }

    // The saved draw as a panel, beside its picture (2026-10-26 12:52 EDT, the loadout treatment for every /manage page); a missing picture shows on the panel itself, so only a reused or failed upload is a note. The draw index records a draw's release season, and it records a draw only once it has a picture, so a season typed with no picture would vanish without a word (2026-11-11 11:42 EST click test). Said, with the way to keep it.
    const seasonNote = form.season && !thumbResult.url ? `${BOT_EMOJI.info} Season ${form.season} is kept once the draw has a picture: Edit, add the picture, and type the Season line again.` : null;
    const notes = [...(thumbResult.url ? [thumbnailNote(thumbResult)] : []), typeNote, seasonNote].filter(Boolean);
    const saved = { ok: true, draw: { ...newDrawObj, _id: result.results[0].applied.elementId }, category: drawType, changeIds: result.changeIds, notes, warnings, endDate: endOp ? dates.end : (row?.endDate || null), titles: [title] };
    if (opts.quiet) return saved;
    const sent = await interaction.followUp({ flags: 32768 | 64, components: drawPanel({ draw: saved.draw, category: drawType, changeIds: saved.changeIds, notes, warnings, endDate: saved.endDate }) });
    // Items the draw index has no kind for are asked about, not left blank (handlers/manage/itemKinds.js).
    await require('./itemKinds').askItemKinds(interaction, [title]);
    return sent;
}

// --- SAVE EDITED DRAW --- custom_id: edit_draw_{id}_{new|returning}. `opts.customId` names the draw when the pop-up carried another id, and a caller that already acknowledged the interaction skips the defer: the /manage draws panel opens this same pop-up from a draw card under its own id and redraws the card in place after the save (2026-11-07 19:13 EST).
async function editDraw(interaction, opts = {}) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ ephemeral: true });
    const { toTitleCase, parseItemLine } = require('../../utils/adminParser');
    const [, , targetId, drawType] = (opts.customId || interaction.customId).split('_');

    // Existence pre-check kept exactly as before the refactor -- draw.edit's op would also report this as `reason: 'missing'`, but the pre-core handler simply returned with no reply at all when the id wasn't found (a stale search result), and this preserves that exact silent behaviour rather than introducing a new error reply where none existed.
    const seasonalDoc = await loadOrCreateSeasonalDoc();
    const arrayTarget = drawType === 'new' ? seasonalDoc.newDraws : seasonalDoc.returningDraws;
    const drawIndex = arrayTarget.findIndex(d => d._id.toString() === targetId);

    if (drawIndex > -1) {
        const form = require('../../utils/drawForm').readDrawFields(interaction, { allowSeason: drawType === 'new' });
        if (form.error) return opts.quiet ? (await failWithRetry(interaction, form.error), { ok: false }) : await failWithRetry(interaction, form.error);
        const drawDateStr = form.dateStr;
        // "Start - End" like the season titles box (utils/drawDates.js): the start is the release date, the end lives on the draw's /calendar row and is written in the same commit.
        const { parseDrawDates, planEndRow } = require('../../utils/drawDates');
        // A bare countdown keeps the draw's own start; only the end moves.
        const dates = parseDrawDates(drawDateStr, { start: arrayTarget[drawIndex].date || null });
        if (!dates.ok) return await failWithRetry(interaction, dates.error);
        const parsedDrawDate = dates.start;
        const newTitle = toTitleCase(form.title);

        // URL field is optional -- blank reuses whatever's cached in Cloudinary for this draw's (possibly just-renamed) title. No URL AND no cache hit used to be a hard rejection; relaxed 2026-08-22 19:40 EDT (click-test fix) to save without an image instead (matches addDraw's same-day fix) rather than blocking an otherwise-valid edit.
        const rawUrl = form.rawUrl;
        const rawItems = form.rawItems;
        const parsedItems = rawItems.split('\n').filter(l => l.trim().length > 0).map(parseItemLine);
        // A New draw's first picture can arrive here rather than in Add Draw: the index gets this season then, if it has never seen the draw.
        const releaseSeason = drawType === 'new' ? (form.season || require('../../utils/quickAdd').seasonNumber(seasonalDoc.currentSeasonTitle)) : null;
        const typedOther = form.season && form.season !== require('../../utils/quickAdd').seasonNumber(seasonalDoc.currentSeasonTitle);
        const releaseYear = typedOther ? null : require('../../utils/quickAdd').seasonYear(seasonalDoc);
        // The stored picture is kept as it is when the box still holds it and the title is the same (2026-11-10 11:19 EST): the box is pre-filled with the stored link, so every Edit used to send it through resolveThumbnail again. A blank box still asks the draw index (a picture may have arrived since), and a new link or a new title resolves as before.
        const storedUrl = arrayTarget[drawIndex].thumbnailUrl || '';
        // Items edited still go through resolveThumbnail (which no longer uploads the draw's own picture, utils/cloudinaryCache.js isOwnAsset), so the picture's items link follows the new items.
        const sameItems = parsedItems.map(i => `${i.tier}|${i.name}`).join(';') === (arrayTarget[drawIndex].items || []).map(i => `${i.tier}|${i.name}`).join(';');
        const keepPicture = Boolean(storedUrl) && String(rawUrl || '').trim() === storedUrl && newTitle === arrayTarget[drawIndex].title && sameItems;
        const thumbResult = keepPicture
            ? { url: storedUrl, cached: true, error: null, reused: false, kept: true }
            : await resolveThumbnail(newTitle, rawUrl, { items: parsedItems, priceType: arrayTarget[drawIndex].priceType || '', ...(releaseSeason ? { releaseSeason, ...(releaseYear ? { releaseYear } : {}) } : {}) });

        // Draw Type (2026-10-18 11:06 EDT): the form's dropdown; nothing picked clears it. Sent only when it CHANGED, so an edit that never touches it leaves the stored type, and the op's conflict check, alone. A modal built before this field existed (an old open form) has no dropdown and is read as unchanged.
        let pickedType = null;
        try { pickedType = require('../../utils/formChoice').readChoice(interaction, 'price_type')[0] || ''; } catch { pickedType = null; }
        const storedType = arrayTarget[drawIndex].priceType || '';
        const typeChanged = pickedType !== null && pickedType !== storedType;

        // The row follows a rename and a new start, and gets the typed end; nothing is written to it when none of those changed (utils/drawDates.js planEndRow).
        const row = require('../../utils/drawEndReminder').calendarRowFor(seasonalDoc, arrayTarget[drawIndex].title);
        const { endOp, warnings } = await gateEndOp(interaction.user.id, planEndRow({
            row, prev: { title: arrayTarget[drawIndex].title, start: arrayTarget[drawIndex].date }, title: newTitle, start: parsedDrawDate, end: dates.end
        }));
        // Nothing changed, nothing saved (2026-11-10 11:19 EST): an Edit submitted as it was used to write a change row and answer "Updated · Nothing changed".
        const was = arrayTarget[drawIndex];
        const itemKey = (list) => (list || []).map(i => `${i.tier}|${i.name}`).join(';');
        const sameDraw = newTitle === was.title && new Date(parsedDrawDate).getTime() === new Date(was.date).getTime()
            && itemKey(parsedItems) === itemKey(was.items) && (thumbResult.url || '') === (was.thumbnailUrl || '') && !typeChanged;
        if (sameDraw && !endOp) {
            const why = warnings.length ? `Nothing was saved: ${warnings.join(' ')}` : 'Nothing changed, so nothing was saved.';
            if (opts.quiet) return { ok: true, unchanged: true, note: why };
            return await interaction.followUp({ flags: 32768 | 64, components: notePanel(`${warnings.length ? BOT_EMOJI.warn : BOT_EMOJI.info} ${why}`, warnings.length ? FAIL_ACCENT : ACCENT.draws) });
        }
        const result = await commitSet(
            [{ type: 'draw.edit', target: { elementId: targetId, category: drawType },
               payload: { title: newTitle, date: parsedDrawDate, thumbnailUrl: thumbResult.url, items: parsedItems, ...(typeChanged ? { priceType: pickedType } : {}) } },
             ...(endOp ? [endOp] : [])],
            { actorId: interaction.user.id }
        );
        if (!result.ok) {
            return await failWithRetry(interaction, extractCommitError(result));
        }

        const stored = arrayTarget[drawIndex];
        const before = typeof stored.toObject === 'function' ? stored.toObject() : stored;
        const draw = { _id: targetId, title: newTitle, date: parsedDrawDate, thumbnailUrl: thumbResult.url, items: parsedItems, priceType: typeChanged ? pickedType : storedType };
        const notes = thumbResult.url ? [thumbnailNote(thumbResult)].filter(Boolean) : [];
        const endDate = endOp ? (dates.end || null) : (row?.endDate || null);
        // `opts.quiet`: the saved draw back to the caller instead of a message (the /manage draws panel shows it on the card, 2026-11-10 11:19 EST).
        if (opts.quiet) return { ok: true, draw, before, category: drawType, changeIds: result.changeIds, notes, warnings, endDate, beforeEnd: row?.endDate || null, endChanged: Boolean(endOp), titles: [newTitle] };
        const sent = await interaction.followUp({ flags: 32768 | 64, components: drawPanel({ draw, category: drawType, before, changeIds: result.changeIds, notes, warnings, endDate }) });
        await require('./itemKinds').askItemKinds(interaction, [newTitle]);
        return sent;
    }
    // The reply was deferred above, so a draw that is gone by now (deleted or replaced since the search) must still be answered, or the admin sits on "thinking..." until Discord gives up (found 2026-11-04 00:33 EST, /manage audit; the pre-core handler returned silently here and this kept that).
    if (opts.quiet) return { ok: false, gone: true };
    return await interaction.followUp({ flags: 32768 | 64, components: notePanel(`${BOT_EMOJI.cross} That draw no longer exists (it may have been deleted or replaced since you opened it), so nothing was saved.`, FAIL_ACCENT) });
}

// --- BULK ADD/REPLACE BOTH DRAW CATEGORIES AT ONCE --- custom_id: modal_draws_bulk_{add|replace}_both One modal, two independently-optional fields -- only whichever field was actually filled in gets touched. Replace upserts by fuzzy-matched title (update in place, keep _id) rather than wholesale- overwriting the array; Add just appends everything parsed. Both categories commit in ONE changeset (matching the pre-core handler's single seasonalDoc.save() for both). `preset` ({ customId, values: { new_text, returning_text } }) is the /manage draws panel's Save after its preview: the text it previewed, not a pop-up's fields, and the interaction may already be acknowledged (2026-11-07 19:13 EST). `opts.quiet` returns { ok, sections, warnings, changeIds, titles } instead of posting the result, so the /manage draws panel shows it in place (2026-11-10 11:19 EST).
async function bulkAddOrReplaceDraws(interaction, preset = null, opts = {}) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ ephemeral: true });
    const customId = preset ? preset.customId : interaction.customId;
    const mode = customId === 'modal_draws_bulk_add_both' ? 'add' : 'replace';
    const opType = mode === 'add' ? 'draw.bulkAdd' : 'draw.bulkReplace';
    const field = (k) => (preset ? (preset.values[k] ?? '') : interaction.fields.getTextInputValue(k));
    const newText = field('new_text')?.trim();
    const returningText = field('returning_text')?.trim();

    if (!newText && !returningText) {
        if (opts.quiet) return { ok: false, error: 'Both fields were left blank, so nothing was changed.' };
        return interaction.followUp({ flags: 32768 | 64, components: notePanel(BOT_EMOJI.cross + ' Both fields were left blank -- nothing was changed.', FAIL_ACCENT) });
    }

    const ops = [];
    if (newText) ops.push({ type: opType, target: { category: 'new' }, payload: { text: newText } });
    if (returningText) ops.push({ type: opType, target: { category: 'returning' }, payload: { text: returningText } });

    const result = await commitSet(ops, { actorId: interaction.user.id });
    if (!result.ok) {
        const why = result.failures?.map(f => f.errors.join(' ')).join(' ') || result.error;
        if (opts.quiet) return { ok: false, error: why };
        return await interaction.followUp({ flags: 32768 | 64, components: notePanel(`${BOT_EMOJI.cross} ${why}`, FAIL_ACCENT) });
    }

    // A typed end ("July 15 - August 20") goes onto the draw's /calendar row, as in the Add and Edit forms. It is a second commit, gated by the Calendar tier like any calendar write (the draws are already saved and have their own Revert); only draws that were actually saved get one, and if the commit is refused the draws stay and the panel says why.
    const sections = [];
    const warnings = [];
    const changeIds = [...result.changeIds];
    {
        const { planEndRow } = require('../../utils/drawDates');
        const { calendarRowFor } = require('../../utils/drawEndReminder');
        const doc = await loadOrCreateSeasonalDoc();
        const endOps = [];
        for (const r of result.results) {
            for (const draw of (r.applied.added || [])) {
                if (!draw.endDate) continue;
                const op = planEndRow({ row: calendarRowFor(doc, draw.title), title: draw.title, start: draw.date, end: draw.endDate });
                if (op) endOps.push(op);
            }
        }
        if (endOps.length) {
            const endResult = await commitSet(endOps, { actorId: interaction.user.id });
            if (endResult.ok) { changeIds.push(...endResult.changeIds); sections.push({ head: 'End dates', lines: [`Set on ${endOps.length} draw${endOps.length === 1 ? ' (its /calendar row)' : 's (their /calendar rows)'}`] }); }
            else warnings.push(`End dates were NOT saved (the draws were): ${extractCommitError(endResult)}`);
        }
    }

    for (const r of result.results) {
        const label = r.applied.category === 'new' ? 'New Draws' : 'Returning Draws';
        if (mode === 'add') {
            sections.push({ head: `${label} · ${r.applied.ids.length} added, ${r.applied.total} in total`, lines: r.applied.added.length ? r.applied.added.map(d => `- ${d.title}`) : ['-# none'] });
            if (r.applied.skipped.length) warnings.push(`Skipped (no URL given and nothing cached yet): ${r.applied.skipped.join(', ')}`);
            if (r.applied.warnings.length) warnings.push(`Cloudinary caching failed, kept the original URL instead: ${r.applied.warnings.join('; ')}`);
        } else {
            sections.push({ head: label, lines: [`${r.applied.updatedCount} updated · ${r.applied.insertedCount} added · ${r.applied.total} in total`] });
        }
        // Types the draw index filled in for draws pasted with none (utils/bulkMerge.js fillTypes).
        if (r.applied.typesFilled?.length) sections.push({ head: `${label} · draw type from the draw index`, lines: r.applied.typesFilled.map(t => `- ${t}`) });
    }
    if (opts.quiet) return { ok: true, mode, sections, warnings, changeIds, titles: pastedTitles(newText, returningText) };
    const sent = await interaction.followUp({ flags: 32768 | 64, components: resultPanel({ page: 'draws', heading: `Bulk ${mode === 'add' ? 'add' : 'replace'} done`, sections, warnings, changeIds }) });
    // Every pasted draw is asked about for items the draw index has no kind for, the same as a single add (handlers/manage/itemKinds.js). The titles come from the pasted text, so Replace's updated draws are covered too.
    await require('./itemKinds').askItemKinds(interaction, pastedTitles(newText, returningText));
    return sent;
}

// The draw titles in Bulk Add or Replace text, both fields, as utils/adminParser.js parseBulkDrawList reads them.
function pastedTitles(...texts) {
    const { parseBulkDrawList } = require('../../utils/adminParser');
    return texts.filter(Boolean).flatMap(t => parseBulkDrawList(t).map(d => d.title));
}

// --- BULK DELETE DRAWS --- custom_id: modal_draws_bulk_remove_{new|returning|either} Dry-run only: computes what WOULD be removed and shows a Confirm/Cancel prompt; the actual save happens from index.js's mng_bulkdelconfirm_ dispatch, via the `apply()` closure stashed here.
async function bulkDeleteDraws(interaction) {
    const { fuzzyMatch } = require('../../utils/search');
    const customId = interaction.customId;
    const drawType = customId.replace('modal_draws_bulk_remove_', ''); // 'new' | 'returning' | 'either'
    const newTitlesRaw = drawType !== 'returning' ? interaction.fields.getTextInputValue('new_titles')?.trim() : '';
    const returningTitlesRaw = drawType !== 'new' ? interaction.fields.getTextInputValue('returning_titles')?.trim() : '';

    const seasonalDoc = await loadOrCreateSeasonalDoc();

    // Dry-run preview only -- fuzzy-matches against the CURRENT live doc, same as before the refactor, so the Confirm prompt shows real matches. The actual removal (by exact id, not a second fuzzy match against possibly-changed data) happens in the op's apply() on Confirm.
    function preview(array, titlesRaw) {
        const requested = titlesRaw.split('\n').map(t => t.trim()).filter(Boolean);
        const removedTitles = [], notFound = [], ids = [];
        let remaining = array;
        for (const title of requested) {
            const match = remaining.find(item => fuzzyMatch(title, item.title));
            if (match) { removedTitles.push(match.title); ids.push(String(match._id)); remaining = remaining.filter(i => i !== match); }
            else notFound.push(title);
        }
        return { removedTitles, notFound, ids };
    }

    const summary = [];
    const idsByPath = {};
    let anyRemoved = false;
    if (newTitlesRaw) {
        const { removedTitles, notFound, ids } = preview(seasonalDoc.newDraws, newTitlesRaw);
        if (removedTitles.length) { summary.push(`Removed from New: ${removedTitles.join(', ')}`); anyRemoved = true; idsByPath.newDraws = ids; }
        if (notFound.length) summary.push(`${BOT_EMOJI.warn} Not found in New: ${notFound.join(', ')}`);
    }
    if (returningTitlesRaw) {
        const { removedTitles, notFound, ids } = preview(seasonalDoc.returningDraws, returningTitlesRaw);
        if (removedTitles.length) { summary.push(`Removed from Returning: ${removedTitles.join(', ')}`); anyRemoved = true; idsByPath.returningDraws = ids; }
        if (notFound.length) summary.push(`${BOT_EMOJI.warn} Not found in Returning: ${notFound.join(', ')}`);
    }

    if (!anyRemoved) {
        return interaction.reply({ flags: 32768 | 64, components: notePanel(`${BOT_EMOJI.cross} Nothing matched -- nothing to delete.\n${summary.join('\n')}`, FAIL_ACCENT) });
    }

    return registerBulkDelete(interaction, {
        description: 'Bulk Delete Draws',
        summary,
        apply: async () => {
            const result = await commitSet(
                [{ type: 'draw.bulkDelete', payload: { ids: idsByPath } }],
                { actorId: interaction.user.id }
            );
            if (!result.ok) throw new Error(result.failures?.map(f => f.errors.join(' ')).join(' ') || result.error);
            return result.changeIds;   // for the Revert button under the result (handlers/manage/index.js)
        }
    });
}

// --- PURGE (draws) --- called from index.js's mng_purgeconfirm_ dispatch. scope: 'new'|'returning'|'all'.
async function purgeDraws(scope, actorId) {
    const result = await commitSet([{ type: 'draw.purge', target: { scope } }], { actorId });
    if (!result.ok) {
        return { confirmMsg: `${BOT_EMOJI.cross} ${extractCommitError(result)}`, changeIds: [] };
    }
    const { applied } = result.results[0];
    const removedCounts = [];
    if (scope === 'new' || scope === 'all') removedCounts.push(`${applied.newDraws.length} New`);
    if (scope === 'returning' || scope === 'all') removedCounts.push(`${applied.returningDraws.length} Returning`);
    const confirmMsg = `${BOT_EMOJI.checkmark} Purged ${scope === 'all' ? 'all New and Returning draws' : `all ${scope} draws`} (${removedCounts.join(', ')} removed).`;
    // changeIds since 2026-11-10 11:19 EST: the draws panel puts a Revert under a purge.
    return { confirmMsg, changeIds: result.changeIds };
}

// --- DELETE (draws) --- called from index.js's mng_delconfirm_ dispatch with the resolved match.
async function deleteDraw(match, actorId) {
    const result = await commitSet(
        [{ type: 'draw.delete', target: { category: match.type, elementId: match.id } }],
        { actorId }
    );
    if (!result.ok) throw new Error(extractCommitError(result));
    return result.changeIds;   // for the Revert button under "Deleted" (handlers/manage/index.js)
}

module.exports = { addDraw, editDraw, bulkAddOrReplaceDraws, bulkDeleteDraws, purgeDraws, deleteDraw };
