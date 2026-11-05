// utils/newsTriage/card.js -- the card Dioreo Admin posts in #news-distill for a news post, and the daily skipped list (news-channel-triage, built 2026-11-04 20:02 EST). Pure Components V2 JSON, so scripts/newsTriage.test.js can count its components and measure its custom ids.
//
// Every button opens a /manage box he already uses (handlers/news.js); nothing on the card writes anything. Ids are `news|go|<card id>|<item>`, `news|dismiss|<card id>` and `news|make` (the skipped list's dropdown).
const emojis = require('../emojiMap');

const ACCENT = 0x3A5068; // /calendar's Slate Harbor: the card is about the calendar's data (.claude/rules/rendering-and-ui.md)
// Eight items fit: text, row and button are three components each, and the frame takes about nine of Discord's 40 (scripts/newsTriage.test.js pins eight rich items under 40 components and 4,000 characters). It was five until 2026-11-04 22:09 EST, which hid three of eight playlists in CODM's own season post and three of eight draws in a #leaks roundup with no way to open them.
const MAX_ITEMS = 8;
const SPACERS_UP_TO = 5;

function kindLabel(item) {
    if (item.action === 'fix') return 'Dates changed';
    if (item.kind === 'season') return item.part && item.part !== 'main' ? `Next season · ${item.part}` : 'Next season';
    if (item.change === 'cancelled') return 'Cancelled';
    if (item.change === 'changed') return 'Changed';
    if (item.kind === 'draw') return item.drawType === 'returning' ? 'Returning draw' : 'New draw';
    return { event: 'Event', mode: 'Playlist or mode', patch: 'Patch notes' }[item.kind] || 'Info';
}
function kindEmoji(item) {
    if (item.kind === 'draw') return item.drawType === 'returning' ? emojis.returningDraws : emojis.newDraws;
    return { event: emojis.events, mode: emojis.modes, patch: emojis.patchNotes }[item.kind] || emojis.mngInfo;
}
function buttonLabel(item) {
    if (item.action === 'draw') return item.where === 'draft' ? 'Add to Next Season Draft' : (item.drawType === 'returning' ? 'Add Returning Draw' : 'Add New Draw');
    if (item.action === 'calendar') return item.where === 'draft' ? 'Add to Draft Calendar' : (item.kind === 'mode' ? 'Add Mode' : 'Add Event');
    if (item.action === 'patch') return 'Open Add to Patch Notes';
    if (item.action === 'season') return 'Set Next Season Title & Start';
    if (item.action === 'fix') return 'Fix the dates on the bot';
    return null;
}
const ts = d => Math.floor(new Date(d).getTime() / 1000);
// A day-only date is written out in UTC, not as a Discord timestamp: every admin date is 00:00 UTC (.claude/rules/design-decisions.md), and <t:…:D> showed Nov 17 as Nov 16 to a viewer west of UTC (seen on the dev bot, 2026-11-04 20:14 EST).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const day = d => { const x = new Date(d); return `${MONTHS[x.getUTCMonth()]} ${x.getUTCDate()}, ${x.getUTCFullYear()}`; };
const when = d => (new Date(d).getUTCHours() || new Date(d).getUTCMinutes() ? `<t:${ts(d)}:f>` : day(d));

function dateLine(item) {
    const dates = item.start ? `${when(item.start)}${item.end ? ` – ${when(item.end)}` : ''}` : (item.action === 'patch' ? 'No date needed' : 'No date');
    const where = item.where === 'draft' ? 'Next Season Draft' : 'This season';
    const said = item.startText ? ` · post says "${String(item.startText).slice(0, 60)}"` : '';
    return `-# ${dates} · ${where}${said}`;
}

// card: { _id, sourceName, jumpUrl, postedAt, items, dismissed, notes }
function buildCard(card) {
    const id = String(card._id);
    const head = `### ${emojis.mngInfo} From #${card.sourceName || 'news'}\n-# Posted <t:${ts(card.postedAt)}:R>`;
    const parts = [{ type: 10, content: head }, { type: 14, spacing: 1, divider: true }];
    // What news triage wrote into the Next Season Draft for this post, with Undo below (2026-11-04 23:59 EST).
    if ((card.draftLines || []).length || (card.draftNotes || []).length) {
        const lines = (card.draftLines || []).slice(0, 15).map(l => `- ${l}`);
        if ((card.draftLines || []).length > 15) lines.push(`-# +${card.draftLines.length - 15} more`);
        const notes = (card.draftNotes || []).slice(0, 6).map(n => `-# ${n}`);
        const head2 = (card.draftLines || []).length ? `**${card.draftUndone ? `${emojis.cross} Undone:` : `${emojis.checkmark} In the Next Season Draft:`}**` : '';
        parts.push({ type: 10, content: [head2, ...lines, ...notes].filter(Boolean).join('\n').slice(0, 1800) });
        if ((card.items || []).length) parts.push({ type: 14, spacing: 1, divider: true });
    }
    const items = (card.items || []).slice(0, MAX_ITEMS);
    items.forEach((item, i) => {
        const lines = [`${kindEmoji(item)} **${item.name}** · ${kindLabel(item)}${item.doubleCP ? ' · 2X CP' : ''}`, dateLine(item)];
        for (const w of item.warnings || []) lines.push(`-# ${emojis.warn} ${w}`);
        if (item.rewards?.length) lines.push(`-# Rewards: ${item.rewards.slice(0, 4).map(r => r.name).join(' · ')}${item.rewards.length > 4 ? ` +${item.rewards.length - 4}` : ''}`);
        parts.push({ type: 10, content: lines.join('\n').slice(0, 1800) });
        const label = buttonLabel(item);
        if (label) {
            const opened = item.state === 'opened';
            parts.push({ type: 1, components: [{ type: 2, style: opened ? 2 : 1, label: opened ? `${label} (opened)` : label, custom_id: `news|go|${id}|${i}`, disabled: Boolean(card.dismissed) }] });
        }
        if (i < items.length - 1 && items.length <= SPACERS_UP_TO) parts.push({ type: 14, spacing: 1, divider: false });
    });
    for (const note of card.notes || []) parts.push({ type: 10, content: `-# ${note}` });
    parts.push({ type: 14, spacing: 2, divider: true });
    if (card.dismissed) parts.push({ type: 10, content: `-# ${emojis.cross} **Dismissed**` });
    const row = card.jumpUrl ? [{ type: 2, style: 5, label: 'Open post', url: card.jumpUrl }] : [];
    if (card.draftChangeId && !card.draftUndone) row.push({ type: 2, style: 4, label: 'Undo draft changes', custom_id: `news|undo|${id}` });
    if (!card.dismissed) row.push({ type: 2, style: 2, label: 'Dismiss', custom_id: `news|dismiss|${id}` });
    parts.push({ type: 1, components: row });
    return [{ type: 17, accent_color: ACCENT, components: parts }];
}

// The once-a-day list of posts that got no card. entries: [{ title, reason, jumpUrl, channelId, messageId }]
function buildSkippedList(entries, { dayLabel = 'the last day' } = {}) {
    const shown = entries.slice(0, 20);
    const lines = shown.map(e => `- [${(e.title || 'Untitled post').replace(/[[\]]/g, '').slice(0, 80)}](${e.jumpUrl}) · ${e.reason}`);
    const more = entries.length > shown.length ? `\n-# +${entries.length - shown.length} more` : '';
    const parts = [
        { type: 10, content: `### ${emojis.mngInfo} Skipped in ${dayLabel}\n-# ${entries.length} post${entries.length === 1 ? '' : 's'} got no card` },
        { type: 14, spacing: 1, divider: true },
        { type: 10, content: (lines.join('\n') + more).slice(0, 3500) || '-# Nothing skipped.' },
    ];
    const options = entries.slice(0, 25).map(e => ({ label: (e.title || 'Untitled post').slice(0, 100), value: `${e.channelId}:${e.messageId}`, description: String(e.reason).slice(0, 100) }));
    if (options.length) parts.push({ type: 14, spacing: 1, divider: true }, { type: 1, components: [{ type: 3, custom_id: 'news|make', placeholder: 'Make a card from one of these…', options }] });
    return [{ type: 17, accent_color: ACCENT, components: parts }];
}

// The daily briefing (2026-11-05 11:07 EST, Harkirat: "put yourself in my eyes… what info do I NEED and want to KNOW?"). One message at 00:05 UTC answering, in order: did it work and what did it cost; is the Next Season Draft ready, and what is missing; what on the live bot does the news say is wrong; is each followed channel still delivering; and what it skipped (with Make a card). Pure, so the test counts its components and characters.
const listNames = (rows, n = 5) => rows.slice(0, n).join(', ') + (rows.length > n ? ` +${rows.length - n}` : '');
function buildBriefing(b, { dayLabel = 'Last 24 hours' } = {}) {
    const ok = emojis.checkmark; const warn = emojis.warn;
    const s = b.stats || {};
    const parts = [{ type: 10, content: `### ${emojis.mngInfo} News briefing\n-# ${dayLabel}: ${s.reads || 0} post${s.reads === 1 ? '' : 's'} read by the AI ($${(s.costUsd || 0).toFixed(3)}) · ${s.carded || 0} card${s.carded === 1 ? '' : 's'} · ${s.drafted || 0} draft row${s.drafted === 1 ? '' : 's'} written${s.failures ? ` · ${warn} ${s.failures} failed read${s.failures === 1 ? '' : 's'}` : ''}` }];
    const r = b.readiness;
    if (r) {
        const mark = (v, label) => `${v ? ok : warn} ${label}`;
        const lines = [`**Next Season Draft**${r.title ? `: ${r.title}` : ''}`,
            `- ${mark(r.title, r.title ? 'Title' : 'No title yet')} · ${mark(r.bpStart, r.bpStart ? `Starts ${r.bpStart}` : 'No start date')} · ${mark(r.bpEnd, r.bpEnd ? `Ends ${r.bpEnd}` : 'No end date')}`,
            `- Ranked: ${r.ranked || `${warn} not set`} · DMZ: ${r.dmz || `${warn} not set`}`,
            `- ${r.calendar} calendar row${r.calendar === 1 ? '' : 's'} · ${r.draws} draw${r.draws === 1 ? '' : 's'} (${r.fromNews} written by news triage)`];
        if (r.noImage.length) lines.push(`- ${warn} No draw image yet: ${listNames(r.noImage)}`);
        if (r.noEnd.length) lines.push(`- ${warn} No end date: ${listNames(r.noEnd)}`);
        if (r.leakOnly.length) lines.push(`- Only from a leak so far: ${listNames(r.leakOnly)}`);
        parts.push({ type: 14, spacing: 1, divider: true }, { type: 10, content: lines.join('\n').slice(0, 1400) });
    }
    if ((b.fixes || []).length) {
        const lines = [`**The bot may be wrong about** (${b.fixes.length})`, ...b.fixes.slice(0, 6).map(f => `- ${f.name}: ${f.text}`)];
        if (b.fixes.length > 6) lines.push(`-# +${b.fixes.length - 6} more on their cards`);
        parts.push({ type: 14, spacing: 1, divider: true }, { type: 10, content: lines.join('\n').slice(0, 1000) });
    }
    if ((b.channels || []).length) {
        const lines = ['**Watching**', ...b.channels.map(c => `- ${c.stale ? `${warn} ` : ''}#${c.name}: last post ${c.lastAt ? `<t:${Math.floor(new Date(c.lastAt).getTime() / 1000)}:R>` : 'unknown'}`)];
        parts.push({ type: 14, spacing: 1, divider: true }, { type: 10, content: lines.join('\n').slice(0, 500) });
    }
    const entries = b.skipped || [];
    if (entries.length) {
        const lines = entries.slice(0, 12).map(e => `- [${(e.title || 'Untitled post').replace(/[[\]]/g, '').slice(0, 70)}](${e.jumpUrl}) · ${e.reason}`);
        if (entries.length > 12) lines.push(`-# +${entries.length - 12} more`);
        parts.push({ type: 14, spacing: 1, divider: true }, { type: 10, content: (`**Skipped** (${entries.length})\n` + lines.join('\n')).slice(0, 1500) });
        const options = entries.slice(0, 25).map(e => ({ label: (e.title || 'Untitled post').slice(0, 100), value: `${e.channelId}:${e.messageId}`, description: String(e.reason).slice(0, 100) }));
        parts.push({ type: 1, components: [{ type: 3, custom_id: 'news|make', placeholder: 'Make a card from one of these…', options }] });
    }
    return [{ type: 17, accent_color: ACCENT, components: parts }];
}

module.exports = { buildCard, buildSkippedList, buildBriefing, buttonLabel, kindLabel, MAX_ITEMS };
