// utils/bulkMerge.js
//
// The two pieces of bulk-paste merge logic shared across every "Add Multiple"/"Replace Multiple" surface. Moved out of handlers/manage/shared.js (2026-08-20 23:42 EDT, portal core Task 6) so core/ops/draws.js can use the SAME real semantics `/manage` has always used, rather than a simplified copy that silently diverges — see [[project_web_admin_portal]] and this file's own commit for the story: a first draft of core/ops/draws.js's bulkReplace did a wholesale array $set, which would have deleted every draw not mentioned in the pasted text. "Replace Multiple" has never meant that.
const mongoose = require('mongoose');
const { resolveThumbnail } = require('./cloudinaryCache');
const { fuzzyMatch } = require('./search');
const { isKnownType } = require('./drawCatalog');
const { drawTypeName, namesDrawType } = require('./drawTypes');

// Resolves (and Cloudinary-caches) a thumbnail for every parsed item, dropping anything that has neither a provided URL nor a cache hit. Named "ForDraws" for historical reasons — it is shape- agnostic (title + thumbnailUrl) and used identically for calendar/patch-note assets too.
//
// `fillTypes` (2026-11-01, the draw index): a draw with no type, or Unsure, takes the type the draw index has for it, when the index knows the draw for certain (its title, another name, or its items; never a near-miss). Only a FRESH paste asks for it: an Undo replays the old draws through here too, and must put back exactly what was there. The titles filled are returned as `typesFilled` so the reply can say so. `releaseSeason`: the season a draw saved into New belongs to (the live season, or the draft's for a staged one); `releaseYear` its calendar year, which only a staged draw needs to pass (a live one is this year). It reaches the draw index only when the bot creates a document for a draw it has never seen (utils/drawCatalog.js insertFields); a draw the index knows keeps its own.
async function resolveThumbnailsForDraws(draws, { fillTypes = false, releaseSeason = null, releaseYear = null } = {}) {
    // items + price type let a renamed draw find its image by what it contains (utils/cloudinaryCache.js); a calendar or patch-note item has neither and matches by title as before.
    const results = await Promise.all(draws.map(d => resolveThumbnail(d.title, d.thumbnailUrl, d.items ? { items: d.items, priceType: d.priceType || '', ...(releaseSeason ? { releaseSeason, ...(releaseYear ? { releaseYear } : {}) } : {}) } : null)));
    const validDraws = [];
    const skipped = [];
    const warnings = [];
    const typesFilled = [];
    draws.forEach((draw, i) => {
        const result = results[i];
        if (fillTypes && draw.items && !isKnownType(draw.priceType) && namesDrawType(result.catalog?.priceType)) {
            draw.priceType = result.catalog.priceType;
            typesFilled.push(`${draw.title}: ${drawTypeName(draw.priceType)}`);
        }
        if (!result.url) {
            skipped.push(draw.title);
            return;
        }
        draw.thumbnailUrl = result.url;
        validDraws.push(draw);
        if (result.error) warnings.push(`${draw.title} (${result.error})`);
        else if (result.reused && result.matchedTitle) warnings.push(`${draw.title} (thumbnail reused from ${result.matchedBy === 'items' ? 'the cached draw with the same items' : result.matchedBy === 'alias' ? 'the same draw under another name' : 'a similarly-named cached draw'}: "${result.matchedTitle}")`);
    });
    return { validDraws, skipped, warnings, typesFilled };
}

// "Replace Multiple" fuzzy-matches each pasted title against the array being replaced: updates the existing item in place (same _id) on a match, inserts as new otherwise, and never touches anything not mentioned in the paste (Purge already covers a full wipe). Returns a NEW array (finalArray) — core/ops/draws.js runs inside a transaction and must not rely on in-place mutation of a lean() read.
function upsertByTitle(existingArray, parsedItems) {
    let updatedCount = 0;
    let insertedCount = 0;
    const finalArray = [...existingArray];

    for (const parsed of parsedItems) {
        // The same title first, then the best of the fuzzy matches (2026-11-07 19:15 EST): the first fuzzy match let a pasted "Street Fighter: Hero's Collection" update "Champion's Collection", the draw listed before it, because the two share most words. /manage draws' Edit N pastes whole lists back, so this has to pick the right one. utils/search.js bestDrawMatch is the rule /calendar's rows already use.
        const norm = (t) => String(t || '').trim().toLowerCase();
        let matchIndex = finalArray.findIndex(item => norm(item.title) === norm(parsed.title));
        if (matchIndex === -1) {
            const best = require('./search').bestDrawMatch(finalArray, parsed.title, x => x.title, (itemTitle, title) => fuzzyMatch(title, itemTitle));
            matchIndex = best ? finalArray.indexOf(best) : -1;
        }
        if (matchIndex > -1) {
            finalArray[matchIndex] = Object.assign({}, finalArray[matchIndex], parsed);
            updatedCount++;
        } else {
            finalArray.push(parsed);
            insertedCount++;
        }
    }

    return { finalArray, updatedCount, insertedCount };
}
// UNDO OF A SET CHANGE PUTS BACK THE SET (code-housekeeping, 2026-11-04 12:01 EST). Replace Multiple's and Purge's undo used to re-run upsertByTitle with the prior list, which updates and inserts but never removes, so draws or events the forward paste ADDED stayed after Undo; and every draw undo re-ran resolveThumbnailsForDraws, which drops a draw with no image and can hand a draw another draw's image. This restores by _id, touches no outside service, and keeps anything added since that the change did not add. current: the array now · prior: the array before the change · insertedIds: the _ids the change itself added (empty for a Purge, and for a change recorded before 2026-11-04, which did not keep them).
function restoreSet(current, prior, insertedIds = []) {
    const drop = new Set((insertedIds || []).map(String));
    const priorById = new Map(prior.filter(p => p && p._id).map(p => [String(p._id), p]));
    const kept = current.filter(x => !drop.has(String(x._id))).map(x => priorById.get(String(x._id)) || x);
    const have = new Set(kept.map(x => String(x._id)));
    const back = prior.filter(p => !p._id || !have.has(String(p._id)));
    return [...kept, ...back].sort((a, b) => new Date(a.date) - new Date(b.date));
}

// The _ids in `after` that `before` did not have: what a set change added, recorded so its undo can take exactly those out. Gives any new element its _id first, so the id recorded is the id saved.
function addedIds(before, after) {
    const had = new Set(before.map(x => String(x._id)));
    for (const x of after) if (!x._id) x._id = new mongoose.Types.ObjectId();
    return after.filter(x => !had.has(String(x._id))).map(x => String(x._id));
}
module.exports = { resolveThumbnailsForDraws, upsertByTitle, restoreSet, addedIds };
