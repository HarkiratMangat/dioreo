// utils/bulkMerge.js
//
// The two pieces of bulk-paste merge logic shared across every "Add Multiple"/"Replace Multiple"
// surface. Moved out of handlers/manage/shared.js (2026-08-20 23:42 EDT, portal core Task 6) so core/ops/draws.js
// can use the SAME real semantics `/manage` has always used, rather than a simplified copy that
// silently diverges — see [[project_web_admin_portal]] and this file's own commit for the story: a
// first draft of core/ops/draws.js's bulkReplace did a wholesale array $set, which would have deleted
// every draw not mentioned in the pasted text. "Replace Multiple" has never meant that.
const { resolveThumbnail } = require('./cloudinaryCache');
const { fuzzyMatch } = require('./search');

// Resolves (and Cloudinary-caches) a thumbnail for every parsed item, dropping anything that has
// neither a provided URL nor a cache hit. Named "ForDraws" for historical reasons — it is shape-
// agnostic (title + thumbnailUrl) and used identically for calendar/patch-note assets too.
async function resolveThumbnailsForDraws(draws) {
    const results = await Promise.all(draws.map(d => resolveThumbnail(d.title, d.thumbnailUrl)));
    const validDraws = [];
    const skipped = [];
    const warnings = [];
    draws.forEach((draw, i) => {
        const result = results[i];
        if (!result.url) {
            skipped.push(draw.title);
            return;
        }
        draw.thumbnailUrl = result.url;
        validDraws.push(draw);
        if (result.error) warnings.push(`${draw.title} (${result.error})`);
        else if (result.reused && result.matchedTitle) warnings.push(`${draw.title} (thumbnail reused from a similarly-named cached draw: "${result.matchedTitle}")`);
    });
    return { validDraws, skipped, warnings };
}

// "Replace Multiple" fuzzy-matches each pasted title against the array being replaced: updates the
// existing item in place (same _id) on a match, inserts as new otherwise, and never touches anything
// not mentioned in the paste (Purge already covers a full wipe). Returns a NEW array (finalArray) —
// core/ops/draws.js runs inside a transaction and must not rely on in-place mutation of a lean() read.
function upsertByTitle(existingArray, parsedItems) {
    let updatedCount = 0;
    let insertedCount = 0;
    const finalArray = [...existingArray];

    for (const parsed of parsedItems) {
        const matchIndex = finalArray.findIndex(item => fuzzyMatch(parsed.title, item.title));
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
const upsertDrawsByTitle = upsertByTitle;
const upsertEventsByTitle = upsertByTitle;

module.exports = { resolveThumbnailsForDraws, upsertByTitle, upsertDrawsByTitle, upsertEventsByTitle };
