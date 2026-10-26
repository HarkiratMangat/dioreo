// utils/managePanels.js
//
// The panels /manage's Draws, Calendar and Patch Notes pages answer with, the same treatment the loadout flow got in utils/loadoutPanels.js (Harkirat, 2026-10-26 11:46 EDT: "even the confirmation messages and stuff, can you make them like as an embed ... with better visual information ... and there's like buttons as well"; built for these three pages on his "build them right now here", 12:52 EDT). Pure: each takes plain data and returns Components V2 JSON, so scripts/managePanels.test.js pins them without Discord or Mongo.
//
// Every panel shows the saved item the way it now stands (a draw beside its picture, an event with its dates), an edit lists only what changed with the old value struck through, and two buttons do the next thing without going back through /manage: Edit again (the item's own pop-up) and Revert (every change the save made, newest first). Both are stateless custom_ids, handled by handlers/manage/results.js, so they keep working after a restart.
const emojis = require('./emojiMap');

const ACCENT = { draws: 7032445, calendar: 3821672, patchnotes: 15909424 };   // commands/manage.js PAGE_ACCENT
const WARN_ACCENT = 0xF0B232;
const FAIL_ACCENT = 0xED4245;

const isUrl = (u) => /^https?:\/\//i.test(String(u || ''));
const stamp = (d, f = 'D') => (d ? `<t:${Math.floor(new Date(d).getTime() / 1000)}:${f}>` : null);
const CALENDAR_LABEL = { draw: 'Lucky Draw', event: 'Event', playlist: 'Playlist & Mode' };

// The title and summary lines, with a picture beside them when there is one.
function headerBlock(title, lines, imageUrl) {
    const content = [title, ...lines.filter(Boolean)].join('\n');
    if (!isUrl(imageUrl)) return { type: 10, content };
    return { type: 9, components: [{ type: 10, content }], accessory: { type: 11, media: { url: imageUrl } } };
}

const divider = (shown = true) => ({ type: 14, divider: shown, spacing: 1 });

// A draw's items the way /draws lists them: the tier icon, then the name; a "-#" comment line stays a comment.
function itemLines(items = []) {
    return items.map(item => (item.tier === 'comment' ? `-# ${item.name}` : `${emojis[String(item.tier).toLowerCase()] || '🔹'} ${item.name}`)).join('\n');
}

// One "Field: ~~old~~ → new" line per field that changed.
function changeLine(out, name, a, b) {
    if ((a || '') !== (b || '')) out.push(`**${name}:** ${a ? `~~${a}~~ → ` : ''}${b || '*none*'}`);
}

function drawChanges(before, after) {
    if (!before) return [];
    const { drawTypeName } = require('./drawTypes');
    const out = [];
    changeLine(out, 'Title', before.title, after.title);
    changeLine(out, 'Releases', stamp(before.date), stamp(after.date));
    changeLine(out, 'Type', drawTypeName(before.priceType || ''), drawTypeName(after.priceType || ''));
    if ((before.thumbnailUrl || '') !== (after.thumbnailUrl || '')) out.push(`**Picture:** ${after.thumbnailUrl ? (before.thumbnailUrl ? 'replaced' : 'added') : 'removed'}`);
    const key = (i) => `${i.tier}|${i.name}`;
    const oldI = (before.items || []).map(key), newI = (after.items || []).map(key);
    const added = (after.items || []).filter(i => !oldI.includes(key(i))), removed = (before.items || []).filter(i => !newI.includes(key(i)));
    if (added.length || removed.length) out.push(`**Items:** ${[...added.map(i => `+ ${i.name}`), ...removed.map(i => `− ~~${i.name}~~`)].join(' · ')}`);
    else if (oldI.join(',') !== newI.join(',')) out.push('**Items:** reordered');
    return out;
}

function eventChanges(before, after) {
    if (!before) return [];
    const out = [];
    changeLine(out, 'Title', before.title, after.title);
    changeLine(out, 'Type', CALENDAR_LABEL[before.category] || before.category, CALENDAR_LABEL[after.category] || after.category);
    changeLine(out, 'Starts', stamp(before.date), stamp(after.date));
    changeLine(out, 'Ends', before.isOngoing ? 'All Season' : stamp(before.endDate), after.isOngoing ? 'All Season' : stamp(after.endDate));
    if (Boolean(before.isDoubleCP) !== Boolean(after.isDoubleCP)) out.push(`**Double CP:** ${after.isDoubleCP ? 'on' : 'off'}`);
    return out;
}

// Open (the item where players see it, privately), Edit again and Revert. `changeIds` are every ChangeLog row the save wrote (ids like `#147`); a Revert id past Discord's 100 characters is left off rather than cut.
function actionRow({ openId = null, openLabel = 'Open', editId = null, changeIds = [] }) {
    const revertId = `mng_rsrevert|${changeIds.join(',')}`;
    const buttons = [
        ...(openId ? [{ type: 2, style: 2, label: openLabel, custom_id: openId, emoji: emojis.parseEmoji(emojis.search) }] : []),
        ...(editId ? [{ type: 2, style: 1, label: 'Edit again', custom_id: editId, emoji: emojis.parseEmoji(emojis.edit) }] : []),
        ...(changeIds.length && revertId.length <= 100 ? [{ type: 2, style: 4, label: 'Revert', custom_id: revertId }] : []),
    ];
    return buttons.length ? [divider(false), { type: 1, components: buttons }] : [];
}

const noteBlock = (notes) => (notes.length ? [{ type: 10, content: notes.map(n => `-# ${n}`).join('\n') }] : []);
const warnBlock = (warnings) => (warnings.length ? [{ type: 10, content: warnings.map(w => `${emojis.warn} ${w}`).join('\n') }] : []);
const whatChanged = (before, changes) => (before ? [{ type: 10, content: changes.length ? `**What changed**\n${changes.map(c => `- ${c}`).join('\n')}` : '-# Nothing changed.' }] : []);

// A saved draw. `before` is null for an add; `category` is 'new' or 'returning'.
function drawPanel({ draw, category, before = null, changeIds = [], notes = [], warnings = [] }) {
    const { drawTypeName } = require('./drawTypes');
    const kind = drawTypeName(draw.priceType || '');
    const components = [
        headerBlock(`### ${emojis.checkmark} ${before ? 'Updated' : 'Added'} · ${draw.title}`, [
            `-# ${category === 'new' ? 'New' : 'Returning'} draw${kind ? ` · ${kind}` : ''} · releases ${stamp(draw.date)}`,
            isUrl(draw.thumbnailUrl) ? null : '-# No picture',
        ], draw.thumbnailUrl),
        divider(),
        ...whatChanged(before, drawChanges(before, draw)),
        { type: 10, content: `**Items (${(draw.items || []).filter(i => i.tier !== 'comment').length})**\n${itemLines(draw.items) || '*none*'}`.slice(0, 3800) },
        ...noteBlock(notes), ...warnBlock(warnings),
        ...actionRow({ openId: `mng_rsopen|draws|${category}`, openLabel: 'Open in /draws', editId: `mng_rsedit|draws|${category}|${draw._id}`, changeIds }),
    ];
    return [{ type: 17, accent_color: warnings.length ? WARN_ACCENT : ACCENT.draws, components }];
}

// A saved calendar event.
function calendarPanel({ event, before = null, changeIds = [], notes = [], warnings = [] }) {
    const components = [
        headerBlock(`### ${emojis.checkmark} ${before ? 'Updated' : 'Added'} · ${event.title}`, [
            `-# ${CALENDAR_LABEL[event.category] || 'Event'}${event.isDoubleCP ? ' · Double CP' : ''}`,
            `**${stamp(event.date)}** → **${event.isOngoing ? 'All Season' : stamp(event.endDate)}**`,
        ]),
        ...(before ? [divider(), ...whatChanged(before, eventChanges(before, event))] : []),
        ...noteBlock(notes), ...warnBlock(warnings),
        ...actionRow({ openId: 'mng_rsopen|calendar', openLabel: 'Open in /calendar', editId: `mng_rsedit|calendar|${event._id}`, changeIds }),
    ];
    return [{ type: 17, accent_color: warnings.length ? WARN_ACCENT : ACCENT.calendar, components }];
}

// A saved patch-notes season: what was saved, the season's title, its picture count, and Edit again on that season.
function patchPanel({ heading, title, lines = [], entryId = null, changeIds = [], notes = [] }) {
    const components = [
        headerBlock(`### ${emojis.checkmark} ${heading}`, [title ? `**${title}**` : null, ...lines.map(l => `-# ${l}`)]),
        ...noteBlock(notes),
        ...actionRow({ openId: entryId ? `mng_rsopen|patch|${entryId}` : null, openLabel: 'Open in /patch notes', editId: entryId ? `mng_rsedit|patch|${entryId}` : null, changeIds }),
    ];
    return [{ type: 17, accent_color: ACCENT.patchnotes, components }];
}

// A bulk paste, banners or any other result with sections: each section is { head, lines }.
function resultPanel({ page, heading, summary = null, sections = [], warnings = [], changeIds = [] }) {
    const components = [{ type: 10, content: [`### ${emojis.checkmark} ${heading}`, summary].filter(Boolean).join('\n') }];
    const body = sections.filter(s => s.lines && s.lines.length);
    if (body.length) components.push(divider(), ...body.map(s => ({ type: 10, content: `**${s.head}**\n${s.lines.join('\n')}`.slice(0, 3800) })));
    components.push(...warnBlock(warnings).map(b => ({ ...b, content: b.content.slice(0, 3800) })), ...actionRow({ changeIds }));
    return [{ type: 17, accent_color: warnings.length ? WARN_ACCENT : (ACCENT[page] || ACCENT.draws), components }];
}

// The delete confirmation for one draw or event: the item itself, so the right one goes.
function deleteItemPanel({ group, match, token }) {
    const doc = match.doc || {};
    const isDraw = group === 'draws';
    const lines = isDraw
        ? [`-# ${match.type === 'new' ? 'New' : 'Returning'} draw · releases ${stamp(doc.date)}`]
        : [`-# ${CALENDAR_LABEL[doc.category] || 'Event'} · ${stamp(doc.date)} → ${doc.isOngoing ? 'All Season' : stamp(doc.endDate)}`];
    lines.push('-# Every change is recorded and can be reverted.');
    return [{ type: 17, accent_color: FAIL_ACCENT, components: [
        headerBlock(`### ${emojis.warn} Delete ${doc.title || match.label}?`, lines, isDraw ? doc.thumbnailUrl : null),
        ...(isDraw && doc.items?.length ? [{ type: 10, content: `**Items**\n${itemLines(doc.items)}`.slice(0, 3800) }] : []),
        { type: 1, components: [
            { type: 2, style: 2, label: 'Cancel', custom_id: `mng_delcancel_${token}` },
            { type: 2, style: 4, label: 'Yes, delete', custom_id: `mng_delconfirm_${token}`, emoji: emojis.parseEmoji(emojis.deleteBin) },
        ] },
    ] }];
}

// The bulk-delete confirmation: what would go, before anything does.
function bulkDeletePanel({ description, summary, token }) {
    return [{ type: 17, accent_color: FAIL_ACCENT, components: [
        { type: 10, content: `### ${emojis.warn} ${description}?\n${summary.map(s => `- ${s}`).join('\n')}\n-# Every change is recorded and can be reverted.`.slice(0, 3800) },
        { type: 1, components: [
            { type: 2, style: 2, label: 'Cancel', custom_id: `mng_bulkdelcancel_${token}` },
            { type: 2, style: 4, label: 'Yes, delete', custom_id: `mng_bulkdelconfirm_${token}`, emoji: emojis.parseEmoji(emojis.deleteBin) },
        ] },
    ] }];
}

// "Deleted", with Revert when the delete reported its change ids.
function deletedPanel({ text, changeIds = [] }) {
    return [{ type: 17, accent_color: FAIL_ACCENT, components: [{ type: 10, content: text.slice(0, 3800) }, ...actionRow({ changeIds })] }];
}

// A one-line panel: a failure, a cancel, an expired button.
const notePanel = (text, accent) => [{ type: 17, ...(accent ? { accent_color: accent } : {}), components: [{ type: 10, content: text }] }];

module.exports = { drawPanel, calendarPanel, patchPanel, resultPanel, deleteItemPanel, bulkDeletePanel, deletedPanel, notePanel, drawChanges, eventChanges, actionRow, ACCENT, WARN_ACCENT, FAIL_ACCENT };
