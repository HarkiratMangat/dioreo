// utils/drawForm.js -- the Add and Edit draw pop-ups' one "Draw" box, and their screenshot field (Harkirat, 2026-11-11 11:02 EST: "make the draw title and draw date a combined large text field and provide the 'screenshot' field as the 5th form field", and for Add New "include the release season as an option to mention ... in the same large text field").
//
// The box holds the title on its first line, the dates on a line of their own ("Start - End", one date, or the game's countdown, utils/drawDates.js), and for a NEW draw an optional "Season 10" line naming the season it first came out. Lines are told apart by what they parse as, so their order does not matter; anything left over is an error that names it, because a free-text box must never drop a line silently.
//
// A pop-up opened before this change still carries the old Title and Dates fields, so readDrawFields reads those when there is no box.
const SEASON_RE = /^(?:season|s)\s*(\d{1,3})$/i;

function readDrawBox(text, { allowSeason = false } = {}) {
    const { parseDrawDates } = require('./drawDates');
    const lines = String(text || '').split('\n').map(l => l.trim()).filter(Boolean);
    let season = null, dates = null;
    const rest = [];
    const notes = [];
    for (const line of lines) {
        const m = line.match(SEASON_RE);
        if (m && season === null) { season = Number(m[1]); continue; }
        if (!dates && parseDrawDates(line).ok) { dates = line; continue; }
        rest.push(line);
    }
    if (!rest.length) return { error: 'Put the draw\'s title on the first line of the Draw box.' };
    if (!dates) return { error: `Put the dates on their own line under the title, e.g. "Nov 8 - Nov 21". ${rest.length > 1 ? `"${rest[1].slice(0, 60)}" isn't a date I can read.` : ''}`.trim() };
    if (rest.length > 1) return { error: `The Draw box takes the title, the dates${allowSeason ? ' and a season' : ''}; "${rest[1].slice(0, 60)}" is extra. Items go in the Items box.` };
    if (season !== null && !allowSeason) { notes.push('A season line is only read for a new draw; it was left out.'); season = null; }
    return { title: rest[0], dates, season, notes };
}

// The box's text for a draw: title, dates, and the season for a new draw when one is given.
function drawBoxValue({ title = '', dates = '', season = null } = {}) {
    return [title, dates, season ? `Season ${season}` : ''].filter(Boolean).join('\n');
}

const field = (interaction, id) => { try { return interaction.fields.getTextInputValue(id); } catch { return null; } };

// Everything the Add/Edit savers need from the pop-up. The screenshot, when one is attached, wins over the picture link: its Discord link expires, so it is only ever handed on to be uploaded (utils/cloudinaryCache.js resolveThumbnail), never stored.
function readDrawFields(interaction, { allowSeason = false } = {}) {
    const box = field(interaction, 'draw');
    // A blank or missing box means a pop-up from before the box (or a test double): read the old Title and Dates fields.
    const parsed = box ? readDrawBox(box, { allowSeason }) : { title: field(interaction, 'title') || '', dates: field(interaction, 'date') || '', season: null, notes: [] };
    if (parsed.error) return { error: parsed.error };
    let shot = null;
    try { shot = [...(interaction.fields.getUploadedFiles('shot')?.values() || [])][0] || null; } catch { shot = null; }
    const url = shot?.url || field(interaction, 'url') || '';
    return { title: parsed.title, dateStr: parsed.dates, season: parsed.season, notes: parsed.notes || [], rawUrl: url, fromShot: Boolean(shot), rawItems: field(interaction, 'items') || '' };
}

module.exports = { readDrawBox, drawBoxValue, readDrawFields, SEASON_RE };
