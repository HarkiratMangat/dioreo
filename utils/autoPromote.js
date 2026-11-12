// utils/autoPromote.js -- promote the Next Season Draft once its Battle Pass start passes (2026-11-08 12:09 EST).
//
// Harkirat, 2026-11-08 11:52 EST: "the \"promote to live\" button should open a pop-up with 2 options for me to select: promote to live right now or auto promote on BP start date/time". The pop-up's "Auto-promote" sets draft.autoPromote (core op season.setAutoPromote). bot/lifecycle.js calls runAutoPromote() at start-up and every minute. It CLAIMS the draft first (flips autoPromote off in one atomic update), so two ticks, or a restart mid-run, can never promote twice; then promotes through the same op as the button, as the admin who set it, so it is in History with a Revert. The owner gets a DM either way (CLAUDE.md's owner-DM exceptions): what went live, or why nothing did. The time is read off draft.bpStart at the tick, so moving the start after setting it moves the promote with it.
const SeasonalData = require('../models/SeasonalData');

function isDue(doc, nowMs = Date.now()) {
    const d = doc?.draft;
    return Boolean(d?.active && d.autoPromote && d.bpStart && new Date(d.bpStart).getTime() <= nowMs);
}

function card(ok, lines, heading = null) {
    const emojis = require('./emojiMap');
    return { flags: 32768, components: [{ type: 17, accent_color: ok ? 0x1F8A5E : 0xC0392B, components: [{ type: 10, content: [`### ${ok ? emojis.checkmark : emojis.cross} ${heading || (ok ? 'Auto-promoted to live' : 'Auto-promote did not run')}`, ...lines].join('\n').slice(0, 3800) }] }] };
}

// The review it went live with, as lines under a label (utils/promoteReview.js), or nothing when it was clean.
function reviewBlock(review) {
    const lines = require('./promoteReview').reviewLines(review);
    return lines.length ? ['', '**Reviewed when it went live:**', ...lines.map(l => `- ${l}`)] : [];
}

// The owner's record of a promote by hand (2026-11-11 21:40 EST): the same DM an auto-promote sends, so every promote leaves one. Owner only, through dmOwner, no mentions.
async function notifyPromoted({ message, changeIds = [], review = null, manual = true, actorId = null } = {}) {
    const { dmOwner } = require('./buildSubmissions');
    const text = String(message || '').replace(/^\*\*Draft promoted to live!\*\*\s*/, '');
    return dmOwner(() => card(true, [text, ...(actorId ? [`-# Promoted by <@${actorId}>.`] : []), ...reviewBlock(review), `-# Change ${changeIds.join(', ')} · Revert it from /bot analytics › Changes.`], manual ? 'Promoted to live' : null));
}

async function runAutoPromote() {
    try {
        const claimed = await SeasonalData.findOneAndUpdate(
            { docType: 'global', 'draft.active': true, 'draft.autoPromote': true, 'draft.bpStart': { $lte: new Date() } },
            { $set: { 'draft.autoPromote': false } },
            { returnDocument: 'after' }
        ).lean();
        if (!claimed) return null;
        const actorId = claimed.draft.autoPromoteBy;
        const { dmOwner } = require('./buildSubmissions');
        if (!actorId) {
            await dmOwner(() => card(false, ['The draft was set to auto-promote, but nobody is recorded as setting it. Promote it from `/manage season` › Next Season Draft.'])).catch(e => console.error('autoPromote: owner DM failed:', e.message));
            return { ok: false };
        }
        // The review is read before the promote, so the DM lists what the final carry-over added and what was worth a look (it cannot ask first).
        let review = null;
        try { review = require('./promoteReview').promoteReview(claimed); } catch { review = null; }
        const result = await require('../core/changeset').commitSet([{ type: 'season.promoteDraft' }], { actorId });
        if (result.ok) {
            const { change, applied } = result.results[0];
            console.log(`⏰ Auto-promoted the draft to live: "${change.target}" (${result.changeIds.join(', ')})`);
            await dmOwner(() => card(true, [`**"${change.target}"** is now the live season: ${applied.counts.newDraws} New, ${applied.counts.returningDraws} Returning, ${applied.counts.calendar} calendar event(s).`, ...(require('./promoteSummary').carriedLine(applied.carried) ? [require('./promoteSummary').carriedLine(applied.carried)] : []), ...reviewBlock(review), `-# Change ${result.changeIds.join(', ')} · Revert it from /bot analytics › Changes.`])).catch(e => console.error('autoPromote: owner DM failed:', e.message));
            return { ok: true, changeIds: result.changeIds };
        }
        const why = result.failedAt?.reason === 'missing' ? 'The draft was gone by then.' : (result.failedAt?.errors || []).join(' ') || 'The promote was refused.';
        console.error('autoPromote: promote failed:', why);
        await dmOwner(() => card(false, [why, 'Nothing changed on the live season. Promote it by hand from `/manage season` › Next Season Draft.'])).catch(e => console.error('autoPromote: owner DM failed:', e.message));
        return { ok: false };
    } catch (e) {
        console.error('autoPromote: tick failed:', e.message);
        return null;
    }
}

module.exports = { isDue, runAutoPromote, notifyPromoted };
